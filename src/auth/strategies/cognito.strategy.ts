import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Strategy as CustomStrategy } from 'passport-custom';
import type { Request } from 'express';
import { FhirService } from '../../fhir/fhir.service.js';

@Injectable()
export class CognitoStrategy extends PassportStrategy(CustomStrategy, 'cognito') {
  private readonly verifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor(config: ConfigService, private readonly fhir: FhirService) {
    super();

    this.verifier = CognitoJwtVerifier.create({
      userPoolId: config.get<string>('auth.cognito.userPoolId')!,
      tokenUse: 'id',
      clientId: config.get<string>('auth.cognito.audience')!,
    });
  }

  async validate(req: Request): Promise<any> {
    try {
      const tokenExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();
      const token = tokenExtractor(req);
      if (!token) throw new UnauthorizedException('Missing bearer token');

      const payload: any = await this.verifier.verify(token);
      const email: string | undefined = payload?.email;
      const phoneNumber: string | undefined = payload?.phone_number;
      if (!email && !phoneNumber) throw new UnauthorizedException('Identifier not present in token');

      const groups: string[] = (payload?.['cognito:groups'] as string[]) || [];
      const roles: string[] = Array.isArray(groups) ? groups : [];

      // Enrich with FHIR reference for downstream controllers
      const isClinician = roles.includes('DOCTOR');
      const resourceType = isClinician ? 'Practitioner' : 'Patient';

      let fhirRef: string | undefined;
      try {
        const sub: string | undefined = (payload as any)?.sub;
        if (sub) {
          const bundle: any = await this.fhir.search(resourceType, { identifier: `cognito:user-sub|${sub}` } as any);
          const resource = bundle?.entry?.[0]?.resource;
          if (resource?.id) {
            fhirRef = `${resourceType}/${resource.id}`;
          }
        }
      } catch {
        // ignore
      }

      return { ...payload, email, phone_number: phoneNumber, roles, fhirRef };
    } catch (err) {
      throw new UnauthorizedException('Invalid Cognito token');
    }
  }
}



