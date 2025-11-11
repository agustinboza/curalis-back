import axios, { AxiosInstance } from 'axios';
import { FhirClient } from '../interfaces/fhir-client.interface';

export class HapiFhirClient implements FhirClient {
  private readonly http: AxiosInstance;

  constructor(baseUrl: string) {
    this.http = axios.create({ baseURL: baseUrl, headers: { 'Content-Type': 'application/fhir+json' } });
  }

  async create<TRequest, TResponse = TRequest>(resourceType: string, resource: TRequest): Promise<TResponse> {
    const { data } = await this.http.post<TResponse>(`/${resourceType}`, resource as unknown as object);
    return data;
  }

  async read<TResponse>(resourceType: string, id: string): Promise<TResponse> {
    const { data } = await this.http.get<TResponse>(`/${resourceType}/${id}`);
    return data;
  }

  async update<TRequest, TResponse = TRequest>(resourceType: string, id: string, resource: TRequest): Promise<TResponse> {
    const { data } = await this.http.put<TResponse>(`/${resourceType}/${id}`, resource as unknown as object);
    return data;
  }

  async delete(resourceType: string, id: string): Promise<void> {
    await this.http.delete(`/${resourceType}/${id}`);
  }

  async search<TResponse>(resourceType: string, params: Record<string, string | number | boolean | undefined>): Promise<TResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    const { data } = await this.http.get<TResponse>(`/${resourceType}`, { params: searchParams });
    return data;
  }
}



