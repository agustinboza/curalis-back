"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsModule = void 0;
const common_1 = require("@nestjs/common");
const fhir_module_js_1 = require("../fhir/fhir.module.js");
const patients_controller_js_1 = require("./patients.controller.js");
const patients_service_js_1 = require("./patients.service.js");
const roles_guard_js_1 = require("../auth/guards/roles.guard.js");
let PatientsModule = class PatientsModule {
};
exports.PatientsModule = PatientsModule;
exports.PatientsModule = PatientsModule = __decorate([
    (0, common_1.Module)({
        imports: [fhir_module_js_1.FhirModule],
        controllers: [patients_controller_js_1.PatientsController],
        providers: [patients_service_js_1.PatientsService, roles_guard_js_1.RolesGuard],
    })
], PatientsModule);
//# sourceMappingURL=patients.module.js.map