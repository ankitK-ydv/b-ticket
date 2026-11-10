
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RouteStopsController } from './route-stops.controller.js';
import { RouteStopsService } from './route-stops.service.js';

@Module({
  imports: [AuthModule],
  controllers: [RouteStopsController],
  providers: [RouteStopsService],
})
export class RouteStopsModule {}
