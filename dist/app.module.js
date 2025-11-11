"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const configuration_js_1 = __importDefault(require("./config/configuration.js"));
const app_controller_js_1 = require("./app.controller.js");
const app_service_js_1 = require("./app.service.js");
const fhir_module_js_1 = require("./fhir/fhir.module.js");
const auth_module_js_1 = require("./auth/auth.module.js");
const clinics_module_js_1 = require("./clinics/clinics.module.js");
const patients_module_js_1 = require("./patients/patients.module.js");
const doctors_module_js_1 = require("./doctors/doctors.module.js");
const appointments_module_js_1 = require("./appointments/appointments.module.js");
const procedures_module_js_1 = require("./procedures/procedures.module.js");
const exams_module_js_1 = require("./exams/exams.module.js");
const checkin_module_js_1 = require("./checkin/checkin.module.js");
const users_module_js_1 = require("./users/users.module.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_js_1.default] }),
            fhir_module_js_1.FhirModule,
            auth_module_js_1.AuthModule,
            clinics_module_js_1.ClinicsModule,
            patients_module_js_1.PatientsModule,
            doctors_module_js_1.DoctorsModule,
            appointments_module_js_1.AppointmentsModule,
            procedures_module_js_1.ProceduresModule,
            exams_module_js_1.ExamsModule,
            checkin_module_js_1.CheckinModule,
            users_module_js_1.UsersModule,
        ],
        controllers: [app_controller_js_1.AppController],
        providers: [app_service_js_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map