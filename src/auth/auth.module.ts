import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CognitoStrategy } from './strategies/cognito.strategy';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { FhirModule } from '../fhir/fhir.module.js';

@Module({
  imports: [PassportModule, FhirModule],
  controllers: [AuthController],
  providers: [AuthService, CognitoStrategy],
  exports: [PassportModule, AuthService],
})
export class AuthModule {}



