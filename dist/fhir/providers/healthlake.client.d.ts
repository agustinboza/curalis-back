import { FhirClient } from '../interfaces/fhir-client.interface';
export declare class HealthLakeClient implements FhirClient {
    private readonly http;
    constructor(baseUrl: string);
    create<TRequest, TResponse = TRequest>(resourceType: string, resource: TRequest): Promise<TResponse>;
    read<TResponse>(resourceType: string, id: string): Promise<TResponse>;
    update<TRequest, TResponse = TRequest>(resourceType: string, id: string, resource: TRequest): Promise<TResponse>;
    delete(resourceType: string, id: string): Promise<void>;
    search<TResponse>(resourceType: string, params: Record<string, string | number | boolean | undefined>): Promise<TResponse>;
}
