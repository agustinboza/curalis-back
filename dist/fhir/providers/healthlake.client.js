"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthLakeClient = void 0;
const axios_1 = __importDefault(require("axios"));
class HealthLakeClient {
    http;
    constructor(baseUrl) {
        this.http = axios_1.default.create({ baseURL: baseUrl, headers: { 'Content-Type': 'application/fhir+json' } });
    }
    async create(resourceType, resource) {
        const { data } = await this.http.post(`/${resourceType}`, resource);
        return data;
    }
    async read(resourceType, id) {
        const { data } = await this.http.get(`/${resourceType}/${id}`);
        return data;
    }
    async update(resourceType, id, resource) {
        const { data } = await this.http.put(`/${resourceType}/${id}`, resource);
        return data;
    }
    async delete(resourceType, id) {
        await this.http.delete(`/${resourceType}/${id}`);
    }
    async search(resourceType, params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined)
                searchParams.append(key, String(value));
        });
        const { data } = await this.http.get(`/${resourceType}`, { params: searchParams });
        return data;
    }
}
exports.HealthLakeClient = HealthLakeClient;
//# sourceMappingURL=healthlake.client.js.map