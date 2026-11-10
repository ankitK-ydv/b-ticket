
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PASSENGER')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
  ) {}

  @Post()
  async createTicket(@Body() data: any, @Req() req: any) {
    return this.ticketsService.createTicket(
      data,
      Number(req.user.sub),
    );
  }

  @Get('my')
  async getMyTickets(@Req() req: any) {
    return this.ticketsService.getMyTickets(
      Number(req.user.sub),
    );
  }


  
@Get('conductor/history')
@Roles('CONDUCTOR')
async getConductorHistory(@Req() req: any) {
  return this.ticketsService.getConductorVerificationHistory(
    Number(req.user.sub),
  );
}



  
  @Post('verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CONDUCTOR')
  async verifyTicket(
    @Body() data: { qrToken: string },
    @Req() req: any,
  ) {
    return this.ticketsService.verifyTicket(
      data.qrToken,
      Number(req.user.sub),
    );
  }



  
}
