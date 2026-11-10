
import { Module } from '@nestjs/common';
import { StopsController } from './stops.controller.js';
import { StopsService } from './stops.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [StopsController],
  providers: [StopsService],
})
export class StopsModule {}
