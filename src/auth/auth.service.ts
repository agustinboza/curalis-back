import { Injectable, UnauthorizedException, BadRequestException, ConflictException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  InitiateAuthCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

@Injectable()
export class AuthService {
  private cognito: CognitoIdentityProviderClient;
  private cognitoClientId: string;
  private cognitoUserPoolId: string;
  private idVerifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor(private readonly fhir: FhirService, private readonly config: ConfigService) {
    const region = this.config.getOrThrow<string>('aws.region');
    this.cognito = new CognitoIdentityProviderClient({ region });
    this.cognitoClientId = this.config.getOrThrow<string>('auth.cognito.audience'); // app client id
    this.cognitoUserPoolId = this.config.getOrThrow<string>('auth.cognito.userPoolId');
    this.idVerifier = CognitoJwtVerifier.create({
      userPoolId: this.cognitoUserPoolId,
      tokenUse: 'id',
      clientId: this.cognitoClientId,
    });
  }

  async register(dto: RegisterDto) {
    try {
      await this.cognito.send(new AdminCreateUserCommand({
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
      await this.cognito.send(new AdminSetUserPasswordCommand({
        UserPoolId: this.cognitoUserPoolId,
        Username: dto.email,
        Password: dto.password,
        Permanent: true,
      }));

      await this.addUserToGroupSafe(dto.email, dto.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT');

      const tokens = await this.authenticateWithCognito(dto.email, dto.password);
      // After first login, get the Cognito sub to create the canonical FHIR resource
      let sub = '';
      try {
        const claims: any = await this.idVerifier.verify(tokens.idToken);
        sub = claims?.sub || '';
      } catch {}

      let fhirRef: string | undefined;
      if (sub) {
        if (dto.role === 'PATIENT') {
          const created: any = await this.fhir.create('Patient', {
            resourceType: 'Patient',
            identifier: [{ system: 'cognito:user-sub', value: sub }],
            name: [{ family: dto.lastName, given: [dto.firstName] }],
            telecom: [
              { system: 'email', value: dto.email },
              { system: 'phone', value: dto.phoneNumber },
            ],
          });
          fhirRef = `Patient/${created?.id}`;
        } else {
          const created: any = await this.fhir.create('Practitioner', {
            resourceType: 'Practitioner',
            identifier: [{ system: 'cognito:user-sub', value: sub }],
            name: [{ family: dto.lastName, given: [dto.firstName] }],
            telecom: [
              { system: 'email', value: dto.email },
              { system: 'phone', value: dto.phoneNumber },
            ],
          });
          fhirRef = `Practitioner/${created?.id}`;
        }
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
    } catch (e: any) {
      this.throwCognitoHttpError(e);
    }
  }

  async login(dto: LoginDto) {
    let tokens: { idToken: string; accessToken?: string; refreshToken?: string };
    try {
      tokens = await this.authenticateWithCognito(dto.identifier, dto.password);
    } catch (e: any) {
      this.throwCognitoHttpError(e);
    }
    let emailFromClaims: string | undefined;
    let role: 'PATIENT' | 'DOCTOR' = 'PATIENT';
    let subFromClaims: string | undefined;
    try {
      const claims: any = await this.idVerifier.verify(tokens.idToken);
      emailFromClaims = claims?.email;
      role = this.getRoleFromClaims(claims);
      subFromClaims = claims?.sub;
    } catch {}

    const ensured = await this.lookupFhirBySub(subFromClaims || '', role);
    const user = { id: dto.identifier, role, email: emailFromClaims || dto.identifier, firstName: ensured.firstName, lastName: ensured.lastName, fhirRef: ensured.fhirRef } as any;
    return { token: tokens.idToken, user };
  }

  async me(identifier: string) {
    const tryFind = async (resourceType: 'Patient' | 'Practitioner') => {
      try {
        const bundle: any = await this.fhir.search(resourceType, { telecom: identifier });
        const resource = bundle?.entry?.[0]?.resource;
        if (!resource?.id) return undefined;
        const name = resource?.name?.[0] || {};
        return {
          id: identifier,
          role: resourceType === 'Patient' ? 'PATIENT' : 'DOCTOR',
          email: identifier,
          firstName: name?.given?.[0] ?? '',
          lastName: name?.family ?? '',
          fhirRef: `${resourceType}/${resource.id}`,
        };
      } catch {
        return undefined;
      }
    };
    const asPatient = await tryFind('Patient');
    if (asPatient) return asPatient;
    const asPractitioner = await tryFind('Practitioner');
    if (asPractitioner) return asPractitioner;
    return { id: identifier, role: 'PATIENT', email: identifier } as any;
  }

  async meWithClaims(claims: any) {
    const email: string | undefined = claims?.email;
    const phone: string | undefined = claims?.phone_number;
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
      roles: (claims?.['cognito:groups'] as string[]) || [],
    };
  }

  async updateNames(identifier: string, firstName?: string, lastName?: string) {
    // Update FHIR resource if it exists
    const tryUpdate = async (resourceType: 'Patient' | 'Practitioner') => {
      try {
        const bundle: any = await this.fhir.search(resourceType, { telecom: identifier });
        const resource = bundle?.entry?.[0]?.resource;
        if (!resource?.id) return false;
        const current = await this.fhir.read<any>(resourceType, resource.id);
        const nextName = {
          family: lastName ?? current?.name?.[0]?.family,
          given: [firstName ?? current?.name?.[0]?.given?.[0]].filter(Boolean),
        };
        await this.fhir.update(resourceType, resource.id, { ...current, name: [nextName] });
        return true;
      } catch {
        return false;
      }
    };
    await tryUpdate('Patient') || await tryUpdate('Practitioner');
    return { id: identifier, email: identifier, firstName, lastName } as any;
  }

  private async authenticateWithCognito(username: string, password: string): Promise<{ idToken: string; accessToken?: string; refreshToken?: string }> {
    try {
      const resp = await this.cognito.send(new InitiateAuthCommand({
        ClientId: this.cognitoClientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: { USERNAME: username, PASSWORD: password },
      }));
      const result = resp.AuthenticationResult;
      if (!result?.IdToken) throw new UnauthorizedException('Invalid credentials');
      return { idToken: result.IdToken, accessToken: result.AccessToken, refreshToken: result.RefreshToken };
    } catch (e: any) {
      throw e; // handled by caller via throwCognitoHttpError
    }
  }

  private throwCognitoHttpError(error: any): never {
    const code: string | undefined = error?.name || error?.__type || error?.$metadata?.httpStatusCode;
    const message: string = error?.message || error?.['x-amzn-errormessage'] || 'Authentication error';
    switch (code) {
      case 'UsernameExistsException':
        throw new ConflictException('A user with this email already exists.');
      case 'InvalidPasswordException':
        throw new BadRequestException('Password does not meet policy (uppercase, number, special, length).');
      case 'InvalidParameterException':
        throw new BadRequestException(message);
      case 'NotAuthorizedException':
      case 'UserNotFoundException':
        throw new UnauthorizedException('Invalid email/phone or password.');
      case 'UserNotConfirmedException':
        throw new ForbiddenException('Please confirm your account before signing in.');
      case 'PasswordResetRequiredException':
        throw new ForbiddenException('Password reset required.');
      default:
        throw new BadRequestException(message);
    }
  }

  // ===== Role-specific helpers =====

  private async createFhirPatient(dto: RegisterDto): Promise<{ id: string }> {
    const name = [{ family: dto.lastName, given: [dto.firstName] }];
    const patient: any = await this.fhir.create('Patient', {
      resourceType: 'Patient',
      name,
      telecom: [
        { system: 'email', value: dto.email },
        { system: 'phone', value: dto.phoneNumber },
      ],
    });
    return patient;
  }

  private async createFhirDoctor(dto: RegisterDto): Promise<{ id: string }> {
    const name = [{ family: dto.lastName, given: [dto.firstName] }];
    const practitioner: any = await this.fhir.create('Practitioner', {
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

  private async addUserToGroupSafe(username: string, groupName: string): Promise<void> {
    try {
      await this.cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: this.cognitoUserPoolId, Username: username, GroupName: groupName }));
    } catch {}
  }

  private getRoleFromClaims(claims: any): 'PATIENT' | 'DOCTOR' {
    const groups: string[] = (claims?.['cognito:groups'] as string[]) || [];
    return groups.includes('DOCTOR') ? 'DOCTOR' : 'PATIENT';
  }

  private async ensureFhirForIdentifier(identifier: string, role: 'PATIENT' | 'DOCTOR', claims?: any): Promise<{ fhirRef: string; firstName: string; lastName: string }> {
    // Login should NOT create FHIR resources. Only lookup and return names if present.
    const resourceType = role === 'DOCTOR' ? 'Practitioner' : 'Patient';
    let fhirRef = '';
    let firstName = claims?.given_name ?? '';
    let lastName = claims?.family_name ?? '';
    try {
      const bundle: any = await this.fhir.search(resourceType, { telecom: identifier });
      const resource = bundle?.entry?.[0]?.resource;
      if (resource?.id) {
        fhirRef = `${resourceType}/${resource.id}`;
        const name = resource?.name?.[0] || {};
        firstName = name?.given?.[0] ?? firstName;
        lastName = name?.family ?? lastName;
      }
    } catch {}
    return { fhirRef, firstName, lastName };
  }

  private async lookupFhirBySub(sub: string, role: 'PATIENT' | 'DOCTOR', claims?: any): Promise<{ fhirRef: string; firstName: string; lastName: string }> {
    const resourceType = role === 'DOCTOR' ? 'Practitioner' : 'Patient';
    let fhirRef = '';
    let firstName = claims?.given_name ?? '';
    let lastName = claims?.family_name ?? '';
    if (!sub) return { fhirRef, firstName, lastName };
    try {
      const bundle: any = await this.fhir.search(resourceType, { identifier: `cognito:user-sub|${sub}` } as any);
      const resource = bundle?.entry?.[0]?.resource;
      if (resource?.id) {
        fhirRef = `${resourceType}/${resource.id}`;
        const name = resource?.name?.[0] || {};
        firstName = name?.given?.[0] ?? firstName;
        lastName = name?.family ?? lastName;
      }
    } catch {}
    return { fhirRef, firstName, lastName };
  }
}


