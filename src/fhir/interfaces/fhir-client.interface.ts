export interface FhirClient {
  create<TRequest, TResponse = TRequest>(resourceType: string, resource: TRequest): Promise<TResponse>;
  read<TResponse>(resourceType: string, id: string): Promise<TResponse>;
  update<TRequest, TResponse = TRequest>(resourceType: string, id: string, resource: TRequest): Promise<TResponse>;
  delete(resourceType: string, id: string): Promise<void>;
  search<TResponse>(
    resourceType: string,
    params: Record<string, string | number | boolean | undefined>,
  ): Promise<TResponse>;
}

export const FHIR_CLIENT = 'FHIR_CLIENT';



