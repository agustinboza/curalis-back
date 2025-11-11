import { ConfigService } from '@nestjs/config';
import { Strategy as CustomStrategy } from 'passport-custom';
import type { Request } from 'express';
import { FhirService } from '../../fhir/fhir.service.js';
declare const CognitoStrategy_base: new () => CustomStrategy & {
    validate(...args: any[]): unknown;
};
export declare class CognitoStrategy extends CognitoStrategy_base {
    private readonly fhir;
    private readonly verifier;
    constructor(config: ConfigService, fhir: FhirService);
    validate(req: Request): Promise<any>;
}
export {};
