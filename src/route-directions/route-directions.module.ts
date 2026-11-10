
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RouteDirectionsController } from './route-directions.controller.js';
import { RouteDirectionsService } from './route-directions.service.js';

@Module({
  imports: [AuthModule],
  controllers: [RouteDirectionsController],
  providers: [RouteDirectionsService],
})
export class RouteDirectionsModule {}
