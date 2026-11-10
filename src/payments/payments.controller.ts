
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PASSENGER')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  async createPayment(
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.paymentsService.createPayment(
      data,
      Number(req.user.sub),
    );
  }

  @Get('my')
  async getMyPayments(@Req() req: any) {
    return this.paymentsService.getMyPayments(
      Number(req.user.sub),
    );
  }


  @Post(':paymentId/confirm-test')
async confirmTestPayment(
  @Param('paymentId') paymentId: string,
  @Req() req: any,
) {
  return this.paymentsService.confirmTestPayment(
    Number(paymentId),
    Number(req.user.sub),
  );
}
}
