
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RoutesService } from './routes.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('routes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class RoutesController {
  constructor(
    private readonly routesService: RoutesService,
  ) {}

  @Post()
  async createRoute(
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.routesService.createRoute(
      data,
      Number(req.user.sub),
    );
  }

  @Get('my')
  async getMyRoutes(@Req() req: any) {
    return this.routesService.getMyRoutes(
      Number(req.user.sub),
    );
  }

  @Get(':id')
  async getRouteById(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.routesService.getRouteById(
      Number(id),
      Number(req.user.sub),
    );
  }
}
