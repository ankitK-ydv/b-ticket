import { Module } from '@nestjs/common';
import { RoutesController } from './routes.controller.js';
import { RoutesService } from './routes.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [RoutesController],
  providers: [RoutesService]
})
export class RoutesModule {}
