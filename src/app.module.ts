import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { FhirModule } from './fhir/fhir.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ClinicsModule } from './clinics/clinics.module.js';
import { PatientsModule } from './patients/patients.module.js';
import { DoctorsModule } from './doctors/doctors.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { ProceduresModule } from './procedures/procedures.module.js';
import { ExamsModule } from './exams/exams.module.js';
import { CheckinModule } from './checkin/checkin.module.js';
import { UsersModule } from './users/users.module.js';
import { TelehealthModule } from './telehealth/telehealth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    FhirModule,
    AuthModule,
    ClinicsModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    ProceduresModule,
    ExamsModule,
    CheckinModule,
    UsersModule,
    TelehealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
