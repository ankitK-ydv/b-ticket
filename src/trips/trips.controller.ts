
import { Public } from '../auth/public.decorator.js';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { TripsService } from './trips.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  async createTrip(@Body() data: any, @Req() req: any) {
    return this.tripsService.createTrip(
      data,
      Number(req.user.sub),
    );
  }

  @Get('my')
  async getMyTrips(@Req() req: any) {
    return this.tripsService.getMyTrips(
      Number(req.user.sub),
    );
  }

  // Conductor: Get assigned trips
  @Get('assigned')
  @Roles('CONDUCTOR')
  async getAssignedTrips(@Req() req: any) {
    return this.tripsService.getAssignedTrips(
      Number(req.user.sub),
    );
  }


  @Get('available')
@Public()
async getAvailableTrips(
  @Query('fromStopId') fromStopId: string,
  @Query('toStopId') toStopId: string,
  @Query('date') date: string,
) {
  return this.tripsService.getAvailableTrips({
    fromStopId,
    toStopId,
    date,
  });
}

  // Owner: Get trip by ID
  @Get(':tripId')
  async getTripById(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Req() req: any,
  ) {
    return this.tripsService.getTripById(
      tripId,
      Number(req.user.sub),
    );
  }

  // Owner: Assign conductor
  @Post(':tripId/assign-conductor')
  async assignConductor(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body() data: { conductorId: number },
    @Req() req: any,
  ) {
    return this.tripsService.assignConductor(
      tripId,
      Number(data.conductorId),
      Number(req.user.sub),
    );
  }

  // Owner: Cancel trip
  @Post(':tripId/cancel')
  async cancelTrip(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Req() req: any,
  ) {
    return this.tripsService.cancelTrip(
      tripId,
      Number(req.user.sub),
    );
  }
}
