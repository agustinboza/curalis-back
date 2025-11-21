"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const fhir_service_js_1 = require("../fhir/fhir.service.js");
const config_1 = require("@nestjs/config");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const aws_jwt_verify_1 = require("aws-jwt-verify");
let AuthService = AuthService_1 = class AuthService {
    fhir;
    config;
    logger = new common_1.Logger(AuthService_1.name);
    cognito;
    cognitoClientId;
    cognitoUserPoolId;
    idVerifier;
    constructor(fhir, config) {
        this.fhir = fhir;
        this.config = config;
        const region = this.config.getOrThrow('aws.region');
        this.cognito = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region });
        this.cognitoClientId = this.config.getOrThrow('auth.cognito.audience');
        this.cognitoUserPoolId = this.config.getOrThrow('auth.cognito.userPoolId');
        this.idVerifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
            userPoolId: this.cognitoUserPoolId,
            tokenUse: 'id',
            clientId: this.cognitoClientId,
        });
    }
    async register(dto) {
        let cognitoUserCreated = false;
        try {
            await this.cognito.send(new client_cognito_identity_provider_1.AdminCreateUserCommand({
                UserPoolId: this.cognitoUserPoolId,
                Username: dto.email,
                UserAttributes: [
                    { Name: 'email', Value: dto.email },
                    { Name: 'email_verified', Value: 'true' },
                    { Name: 'given_name', Value: dto.firstName },
                    { Name: 'family_name', Value: dto.lastName },
                    { Name: 'phone_number', Value: dto.phoneNumber },
                    { Name: 'birthdate', Value: dto.birthdate },
                    { Name: 'gender', Value: dto.gender },
                ],
                MessageAction: 'SUPPRESS',
            }));
            cognitoUserCreated = true;
            await this.cognito.send(new client_cognito_identity_provider_1.AdminSetUserPasswordCommand({
                UserPoolId: this.cognitoUserPoolId,
                Username: dto.email,
                Password: dto.password,
                Permanent: true,
            }));
            await this.addUserToGroupSafe(dto.email, dto.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT');
            const tokens = await this.authenticateWithCognito(dto.email, dto.password);
            let sub = '';
            try {
                const claims = await this.idVerifier.verify(tokens.idToken);
                sub = claims?.sub || '';
                if (!sub) {
                    throw new common_1.InternalServerErrorException('Failed to extract user identifier from token');
                }
            }
            catch (error) {
                this.logger.error(`Failed to extract Cognito sub for user ${dto.email}`, error);
                throw new common_1.InternalServerErrorException('Failed to verify authentication token');
            }
            let fhirRef;
            try {
                if (dto.role === 'PATIENT') {
                    const created = await this.fhir.create('Patient', {
                        resourceType: 'Patient',
                        identifier: [{ system: 'cognito:user-sub', value: sub }],
                        name: [{ family: dto.lastName, given: [dto.firstName] }],
                        birthDate: dto.birthdate,
                        gender: dto.gender,
                        telecom: [
                            { system: 'email', value: dto.email },
                            { system: 'phone', value: dto.phoneNumber },
                        ],
                    });
                    if (!created?.id) {
                        throw new common_1.InternalServerErrorException('FHIR Patient resource created but no ID returned');
                    }
                    fhirRef = `Patient/${created.id}`;
                }
                else {
                    const created = await this.fhir.create('Practitioner', {
                        resourceType: 'Practitioner',
                        identifier: [{ system: 'cognito:user-sub', value: sub }],
                        name: [{ family: dto.lastName, given: [dto.firstName] }],
                        telecom: [
                            { system: 'email', value: dto.email },
                            { system: 'phone', value: dto.phoneNumber },
                        ],
                    });
                    if (!created?.id) {
                        throw new common_1.InternalServerErrorException('FHIR Practitioner resource created but no ID returned');
                    }
                    fhirRef = `Practitioner/${created.id}`;
                }
            }
            catch (error) {
                this.logger.error(`Failed to create FHIR resource for user ${dto.email}`, error);
                if (cognitoUserCreated) {
                    try {
                        await this.cognito.send(new client_cognito_identity_provider_1.AdminDeleteUserCommand({
                            UserPoolId: this.cognitoUserPoolId,
                            Username: dto.email,
                        }));
                        this.logger.log(`Rolled back Cognito user creation for ${dto.email}`);
                    }
                    catch (rollbackError) {
                        this.logger.error(`Failed to rollback Cognito user for ${dto.email}`, rollbackError);
                    }
                }
                throw new common_1.InternalServerErrorException('Failed to create user profile. Please try again.');
            }
            const userPayload = {
                id: dto.email,
                role: dto.role,
                email: dto.email,
                firstName: dto.firstName,
                lastName: dto.lastName,
                fhirRef,
            };
            return { token: tokens.idToken, user: userPayload };
        }
        catch (e) {
            if (e instanceof common_1.UnauthorizedException ||
                e instanceof common_1.BadRequestException ||
                e instanceof common_1.ConflictException ||
                e instanceof common_1.ForbiddenException ||
                e instanceof common_1.InternalServerErrorException) {
                throw e;
            }
            this.throwCognitoHttpError(e);
        }
    }
    async login(dto) {
        let tokens;
        try {
            tokens = await this.authenticateWithCognito(dto.identifier, dto.password);
        }
        catch (e) {
            this.throwCognitoHttpError(e);
        }
        let emailFromClaims;
        let role = 'PATIENT';
        let subFromClaims;
        try {
            const claims = await this.idVerifier.verify(tokens.idToken);
            emailFromClaims = claims?.email;
            role = this.getRoleFromClaims(claims);
            subFromClaims = claims?.sub;
        }
        catch { }
        const ensured = await this.lookupFhirBySub(subFromClaims || '', role);
        const user = { id: dto.identifier, role, email: emailFromClaims || dto.identifier, firstName: ensured.firstName, lastName: ensured.lastName, fhirRef: ensured.fhirRef };
        return { token: tokens.idToken, user };
    }
    async me(identifier) {
        const tryFind = async (resourceType) => {
            try {
                const bundle = await this.fhir.search(resourceType, { telecom: identifier });
                const resource = bundle?.entry?.[0]?.resource;
                if (!resource?.id)
                    return undefined;
                const name = resource?.name?.[0] || {};
                return {
                    id: identifier,
                    role: resourceType === 'Patient' ? 'PATIENT' : 'DOCTOR',
                    email: identifier,
                    firstName: name?.given?.[0] ?? '',
                    lastName: name?.family ?? '',
                    fhirRef: `${resourceType}/${resource.id}`,
                };
            }
            catch {
                return undefined;
            }
        };
        const asPatient = await tryFind('Patient');
        if (asPatient)
            return asPatient;
        const asPractitioner = await tryFind('Practitioner');
        if (asPractitioner)
            return asPractitioner;
        return { id: identifier, role: 'PATIENT', email: identifier };
    }
    async meWithClaims(claims) {
        const email = claims?.email;
        const phone = claims?.phone_number;
        const identifier = email || phone || '';
        const role = this.getRoleFromClaims(claims);
        const ensured = await this.lookupFhirBySub(claims?.sub || '', role, claims);
        return {
            id: identifier,
            role,
            email,
            phoneNumber: phone,
            birthdate: claims?.birthdate,
            gender: claims?.gender,
            emailVerified: typeof claims?.email_verified === 'boolean' ? claims?.email_verified : undefined,
            firstName: ensured.firstName,
            lastName: ensured.lastName,
            fhirRef: ensured.fhirRef,
            roles: claims?.['cognito:groups'] || [],
        };
    }
    async updateNames(identifier, firstName, lastName) {
        const tryUpdate = async (resourceType) => {
            try {
                const bundle = await this.fhir.search(resourceType, { telecom: identifier });
                const resource = bundle?.entry?.[0]?.resource;
                if (!resource?.id)
                    return false;
                const current = await this.fhir.read(resourceType, resource.id);
                const nextName = {
                    family: lastName ?? current?.name?.[0]?.family,
                    given: [firstName ?? current?.name?.[0]?.given?.[0]].filter(Boolean),
                };
                await this.fhir.update(resourceType, resource.id, { ...current, name: [nextName] });
                return true;
            }
            catch {
                return false;
            }
        };
        await tryUpdate('Patient') || await tryUpdate('Practitioner');
        return { id: identifier, email: identifier, firstName, lastName };
    }
    async authenticateWithCognito(username, password) {
        try {
            const resp = await this.cognito.send(new client_cognito_identity_provider_1.InitiateAuthCommand({
                ClientId: this.cognitoClientId,
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: { USERNAME: username, PASSWORD: password },
            }));
            const result = resp.AuthenticationResult;
            if (!result?.IdToken)
                throw new common_1.UnauthorizedException('Invalid credentials');
            return { idToken: result.IdToken, accessToken: result.AccessToken, refreshToken: result.RefreshToken };
        }
        catch (e) {
            throw e;
        }
    }
    throwCognitoHttpError(error) {
        const code = error?.name || error?.__type || error?.$metadata?.httpStatusCode;
        const message = error?.message || error?.['x-amzn-errormessage'] || 'Authentication error';
        switch (code) {
            case 'UsernameExistsException':
                throw new common_1.ConflictException('A user with this email already exists.');
            case 'InvalidPasswordException':
                throw new common_1.BadRequestException('Password does not meet policy (uppercase, number, special, length).');
            case 'InvalidParameterException':
                throw new common_1.BadRequestException(message);
            case 'NotAuthorizedException':
            case 'UserNotFoundException':
                throw new common_1.UnauthorizedException('Invalid email/phone or password.');
            case 'UserNotConfirmedException':
                throw new common_1.ForbiddenException('Please confirm your account before signing in.');
            case 'PasswordResetRequiredException':
                throw new common_1.ForbiddenException('Password reset required.');
            default:
                throw new common_1.BadRequestException(message);
        }
    }
    async createFhirPatient(dto) {
        const name = [{ family: dto.lastName, given: [dto.firstName] }];
        const patient = await this.fhir.create('Patient', {
            resourceType: 'Patient',
            name,
            telecom: [
                { system: 'email', value: dto.email },
                { system: 'phone', value: dto.phoneNumber },
            ],
        });
        return patient;
    }
    async createFhirDoctor(dto) {
        const name = [{ family: dto.lastName, given: [dto.firstName] }];
        const practitioner = await this.fhir.create('Practitioner', {
            resourceType: 'Practitioner',
            name,
            telecom: [
                { system: 'email', value: dto.email },
                { system: 'phone', value: dto.phoneNumber },
            ],
        });
        if (dto.departmentId) {
            await this.fhir.create('PractitionerRole', {
                resourceType: 'PractitionerRole',
                practitioner: { reference: `Practitioner/${practitioner.id}` },
                organization: { reference: `Organization/${dto.departmentId}` },
            });
        }
        return practitioner;
    }
    async addUserToGroupSafe(username, groupName) {
        try {
            await this.cognito.send(new client_cognito_identity_provider_1.AdminAddUserToGroupCommand({ UserPoolId: this.cognitoUserPoolId, Username: username, GroupName: groupName }));
        }
        catch { }
    }
    getRoleFromClaims(claims) {
        const groups = claims?.['cognito:groups'] || [];
        return groups.includes('DOCTOR') ? 'DOCTOR' : 'PATIENT';
    }
    async ensureFhirForIdentifier(identifier, role, claims) {
        const resourceType = role === 'DOCTOR' ? 'Practitioner' : 'Patient';
        let fhirRef = '';
        let firstName = claims?.given_name ?? '';
        let lastName = claims?.family_name ?? '';
        try {
            const bundle = await this.fhir.search(resourceType, { telecom: identifier });
            const resource = bundle?.entry?.[0]?.resource;
            if (resource?.id) {
                fhirRef = `${resourceType}/${resource.id}`;
                const name = resource?.name?.[0] || {};
                firstName = name?.given?.[0] ?? firstName;
                lastName = name?.family ?? lastName;
            }
        }
        catch { }
        return { fhirRef, firstName, lastName };
    }
    async lookupFhirBySub(sub, role, claims) {
        const resourceType = role === 'DOCTOR' ? 'Practitioner' : 'Patient';
        let fhirRef = '';
        let firstName = claims?.given_name ?? '';
        let lastName = claims?.family_name ?? '';
        if (!sub)
            return { fhirRef, firstName, lastName };
        try {
            const bundle = await this.fhir.search(resourceType, { identifier: `cognito:user-sub|${sub}` });
            const resource = bundle?.entry?.[0]?.resource;
            if (resource?.id) {
                fhirRef = `${resourceType}/${resource.id}`;
                const name = resource?.name?.[0] || {};
                firstName = name?.given?.[0] ?? firstName;
                lastName = name?.family ?? lastName;
            }
        }
        catch { }
        return { fhirRef, firstName, lastName };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fhir_service_js_1.FhirService, config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map