
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { RouteDirectionsService } from './route-directions.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('route-directions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class RouteDirectionsController {
  constructor(
    private readonly routeDirectionsService: RouteDirectionsService,
  ) {}

  @Post()
  async createDirection(@Body() data: any, @Req() req: any) {
    return this.routeDirectionsService.createDirection(
      data,
      Number(req.user.sub),
    );
  }

  @Get('route/:routeId')
  async getDirectionsByRoute(
    @Param('routeId') routeId: string,
    @Req() req: any,
  ) {
    const id = Number(routeId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Invalid route ID');
    }

    return this.routeDirectionsService.getDirectionsByRoute(
      id,
      Number(req.user.sub),
    );
  }
}
