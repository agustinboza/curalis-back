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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const aws_jwt_verify_1 = require("aws-jwt-verify");
const passport_custom_1 = require("passport-custom");
const fhir_service_js_1 = require("../../fhir/fhir.service.js");
let CognitoStrategy = class CognitoStrategy extends (0, passport_1.PassportStrategy)(passport_custom_1.Strategy, 'cognito') {
    fhir;
    verifier;
    constructor(config, fhir) {
        super();
        this.fhir = fhir;
        this.verifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
            userPoolId: config.get('auth.cognito.userPoolId'),
            tokenUse: 'id',
            clientId: config.get('auth.cognito.audience'),
        });
    }
    async validate(req) {
        try {
            const tokenExtractor = passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken();
            const token = tokenExtractor(req);
            if (!token)
                throw new common_1.UnauthorizedException('Missing bearer token');
            const payload = await this.verifier.verify(token);
            const email = payload?.email;
            const phoneNumber = payload?.phone_number;
            if (!email && !phoneNumber)
                throw new common_1.UnauthorizedException('Identifier not present in token');
            const groups = payload?.['cognito:groups'] || [];
            const roles = Array.isArray(groups) ? groups : [];
            const isClinician = roles.includes('DOCTOR');
            const resourceType = isClinician ? 'Practitioner' : 'Patient';
            let fhirRef;
            try {
                const sub = payload?.sub;
                if (sub) {
                    const bundle = await this.fhir.search(resourceType, { identifier: `cognito:user-sub|${sub}` });
                    const resource = bundle?.entry?.[0]?.resource;
                    if (resource?.id) {
                        fhirRef = `${resourceType}/${resource.id}`;
                    }
                }
            }
            catch {
            }
            return { ...payload, email, phone_number: phoneNumber, roles, fhirRef };
        }
        catch (err) {
            throw new common_1.UnauthorizedException('Invalid Cognito token');
        }
    }
};
exports.CognitoStrategy = CognitoStrategy;
exports.CognitoStrategy = CognitoStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, fhir_service_js_1.FhirService])
], CognitoStrategy);
//# sourceMappingURL=cognito.strategy.js.map