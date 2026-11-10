
import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';

import { StopsService } from './stops.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Public } from '../auth/public.decorator.js';

@Controller('stops')
export class StopsController {
  constructor(
    private readonly stopsService: StopsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  async createStop(@Body() data: any) {
    return this.stopsService.createStop(data);
  }

  @Get()
  @Public()
  async getAllStops() {
    return this.stopsService.getAllStops();
  }

  @Get(':id')
  @Public()
  async getStopById(@Param('id') id: string) {
    const stopId = Number(id);

    if (!Number.isInteger(stopId) || stopId <= 0) {
      throw new BadRequestException('Invalid stop ID');
    }

    return this.stopsService.getStopById(stopId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  async updateStop(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    const stopId = Number(id);

    if (!Number.isInteger(stopId) || stopId <= 0) {
      throw new BadRequestException('Invalid stop ID');
    }

    return this.stopsService.updateStop(
      stopId,
      data,
      Number(req.user.sub),
    );
  }

  // Shared catalogue deletion is deliberately not exposed here.
}
