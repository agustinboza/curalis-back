"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FhirModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fhir_client_interface_1 = require("./interfaces/fhir-client.interface");
const hapi_fhir_client_1 = require("./providers/hapi-fhir.client");
const healthlake_client_1 = require("./providers/healthlake.client");
const fhir_service_js_1 = require("./fhir.service.js");
const fhirClientProvider = {
    provide: fhir_client_interface_1.FHIR_CLIENT,
    inject: [config_1.ConfigService],
    useFactory: (config) => {
        const provider = config.getOrThrow('fhir.provider');
        const baseUrl = config.getOrThrow('fhir.baseUrl');
        if (provider === 'healthlake') {
            return new healthlake_client_1.HealthLakeClient(baseUrl);
        }
        return new hapi_fhir_client_1.HapiFhirClient(baseUrl);
    },
};
let FhirModule = class FhirModule {
};
exports.FhirModule = FhirModule;
exports.FhirModule = FhirModule = __decorate([
    (0, common_1.Module)({
        providers: [fhirClientProvider, fhir_service_js_1.FhirService],
        exports: [fhir_client_interface_1.FHIR_CLIENT, fhir_service_js_1.FhirService],
    })
], FhirModule);
//# sourceMappingURL=fhir.module.js.map