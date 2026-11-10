
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { RouteStopsService } from './route-stops.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('route-stops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class RouteStopsController {
  constructor(
    private readonly routeStopsService: RouteStopsService,
  ) {}

  @Post()
  async addStop(@Body() data: any, @Req() req: any) {
    return this.routeStopsService.addStop(
      data,
      Number(req.user.sub),
    );
  }

  @Get('direction/:routeDirectionId')
  async getOrderedStops(
    @Param('routeDirectionId') routeDirectionId: string,
    @Req() req: any,
  ) {
    const id = Number(routeDirectionId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Invalid route direction ID');
    }

    return this.routeStopsService.getOrderedStops(
      id,
      Number(req.user.sub),
    );
  }

  @Patch(':id')
  async updateStop(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    const routeStopId = Number(id);

    if (!Number.isInteger(routeStopId) || routeStopId <= 0) {
      throw new BadRequestException('Invalid route stop ID');
    }

    return this.routeStopsService.updateStop(
      routeStopId,
      data,
      Number(req.user.sub),
    );
  }

  @Delete(':id')
  async removeStop(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const routeStopId = Number(id);

    if (!Number.isInteger(routeStopId) || routeStopId <= 0) {
      throw new BadRequestException('Invalid route stop ID');
    }

    return this.routeStopsService.removeStop(
      routeStopId,
      Number(req.user.sub),
    );
  }
}
