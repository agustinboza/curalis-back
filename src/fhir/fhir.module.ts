import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FHIR_CLIENT } from './interfaces/fhir-client.interface';
import { HapiFhirClient } from './providers/hapi-fhir.client';
import { HealthLakeClient } from './providers/healthlake.client';
import { FhirService } from './fhir.service.js';

const fhirClientProvider: Provider = {
  provide: FHIR_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const provider = config.getOrThrow<string>('fhir.provider');
    const baseUrl = config.getOrThrow<string>('fhir.baseUrl');
    if (provider === 'healthlake') {
      return new HealthLakeClient(baseUrl);
    }
    return new HapiFhirClient(baseUrl);
  },
};

@Module({
  providers: [fhirClientProvider, FhirService],
  exports: [FHIR_CLIENT, FhirService],
})
export class FhirModule {}


