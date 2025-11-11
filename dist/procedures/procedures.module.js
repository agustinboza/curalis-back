"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProceduresModule = void 0;
const common_1 = require("@nestjs/common");
const fhir_module_js_1 = require("../fhir/fhir.module.js");
const procedures_controller_1 = require("./procedures.controller");
const procedures_service_1 = require("./procedures.service");
const roles_guard_js_1 = require("../auth/guards/roles.guard.js");
let ProceduresModule = class ProceduresModule {
};
exports.ProceduresModule = ProceduresModule;
exports.ProceduresModule = ProceduresModule = __decorate([
    (0, common_1.Module)({
        imports: [fhir_module_js_1.FhirModule],
        controllers: [procedures_controller_1.ProceduresController],
        providers: [procedures_service_1.ProceduresService, roles_guard_js_1.RolesGuard],
    })
], ProceduresModule);
//# sourceMappingURL=procedures.module.js.map