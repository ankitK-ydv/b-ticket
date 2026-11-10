import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { FaresService } from './fares.service.js';
import { Public } from '../auth/public.decorator.js';

@Controller('fares')
export class FareCalculationController {
  constructor(
    private readonly faresService: FaresService,
  ) {}

  @Post('calculate')
  @Public()
  async calculateFare(@Body() data: any) {
    return this.faresService.calculateFare(data);
  }
}