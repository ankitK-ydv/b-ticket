
import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { BusService } from './bus.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('bus')
export class BusController {
  constructor(
    private readonly busService: BusService,
  ) {}

  // Create bus - OWNER only
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  createBus(
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.busService.createBus(
      body,
      Number(req.user.sub),
    );
  }

  // Get owner's buses - OWNER only
  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  getMyBuses(@Request() req: any) {
    return this.busService.getMyBuses(
      Number(req.user.sub),
    );
  }

  // Get all public buses
  @Get()
  getAllBuses() {
    return this.busService.getAllBuses();
  }

  // Get bus by ID - OWNER only
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  getBusById(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.busService.getBusById(
      Number(id),
      Number(req.user.sub),
    );
  }

  // Update bus - OWNER only
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  updateBus(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.busService.updateBus(
      Number(id),
      body,
      Number(req.user.sub),
    );
  }

  // Delete bus - OWNER only
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  deleteBus(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.busService.deleteBus(
      Number(id),
      Number(req.user.sub),
    );
  }
}
