import { Module } from '@nestjs/common';
import { TelehealthService } from './telehealth.service.js';
import { TelehealthController } from './telehealth.controller.js';

@Module({
  controllers: [TelehealthController],
  providers: [TelehealthService],
})
export class TelehealthModule {}
