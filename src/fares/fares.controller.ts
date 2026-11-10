
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Patch,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FaresService } from './fares.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('fares')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class FaresController {
  constructor(private readonly faresService: FaresService) {}

  @Post()
  async createFare(@Body() data: any, @Req() req: any) {
    return this.faresService.createFare(
      data,
      Number(req.user.sub),
    );
  }

  @Get('direction/:routeDirectionId')
  async getFaresByDirection(
    @Param('routeDirectionId') routeDirectionId: string,
    @Req() req: any,
  ) {
    const id = Number(routeDirectionId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(
        'Invalid route direction ID',
      );
    }

    return this.faresService.getFaresByDirection(
      id,
      Number(req.user.sub),
    );

    
  }



  @Patch(':id')
async updateFare(
  @Param('id') id: string,
  @Body() data: any,
  @Req() req: any,
) {
  const fareId = Number(id);

  if (!Number.isInteger(fareId) || fareId <= 0) {
    throw new BadRequestException('Invalid fare ID');
  }

  return this.faresService.updateFare(
    fareId,
    data,
    Number(req.user.sub),
  );
}
  


}
