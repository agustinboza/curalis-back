import type { FhirClient } from './interfaces/fhir-client.interface';
export declare class FhirService {
    private readonly client;
    constructor(client: FhirClient);
    create<TReq, TRes = TReq>(resourceType: string, resource: TReq): Promise<TRes>;
    read<TRes>(resourceType: string, id: string): Promise<TRes>;
    update<TReq, TRes = TReq>(resourceType: string, id: string, resource: TReq): Promise<TRes>;
    delete(resourceType: string, id: string): Promise<void>;
    search<TRes>(resourceType: string, params: Record<string, string | number | boolean | undefined>): Promise<TRes>;
}
