import { Inject, Injectable } from '@nestjs/common';
import type { FhirClient } from './interfaces/fhir-client.interface';
import { FHIR_CLIENT } from './interfaces/fhir-client.interface';

@Injectable()
export class FhirService {
  constructor(@Inject(FHIR_CLIENT) private readonly client: FhirClient) {}

  create<TReq, TRes = TReq>(resourceType: string, resource: TReq) {
    return this.client.create<TReq, TRes>(resourceType, resource);
  }

  read<TRes>(resourceType: string, id: string) {
    return this.client.read<TRes>(resourceType, id);
  }

  update<TReq, TRes = TReq>(resourceType: string, id: string, resource: TReq) {
    return this.client.update<TReq, TRes>(resourceType, id, resource);
  }

  delete(resourceType: string, id: string) {
    return this.client.delete(resourceType, id);
  }

  search<TRes>(resourceType: string, params: Record<string, string | number | boolean | undefined>) {
    return this.client.search<TRes>(resourceType, params);
  }
}


