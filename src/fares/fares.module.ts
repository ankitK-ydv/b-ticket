
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FaresController } from './fares.controller.js';
import { FaresService } from './fares.service.js';
import { FareCalculationController } from './fare-calculation.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [FaresController, FareCalculationController],
  providers: [FaresService],
})
export class FaresModule {}
