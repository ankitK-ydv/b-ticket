
import {
  Injectable,
  BadRequestException,
  NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import crypto from 'node:crypto';

@Injectable()
export class PaymentsService {
  async createPayment(data: any, passengerId: number) {
    const ticketId = Number(data.ticketId);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      throw new BadRequestException('Valid ticketId is required');
    }

    const tickets = await db.orm.public.Ticket.all();

    const ticket = tickets.find(
      (item) => item.id === ticketId,
    );

    if (!ticket || ticket.passengerId !== passengerId) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(
        'Ticket is not awaiting payment',
      );
    }

    const payments = await db.orm.public.Payment.all();

    const existingPayment = payments.find(
      (item) => item.ticketId === ticketId,
    );

    if (existingPayment) {
      return existingPayment;
    }

    const payment = await db.orm.public.Payment.create({
      ticketId: ticket.id,
      amount: ticket.fareAmount,
      status: 'PENDING',
      provider: 'TEST',
    });

    return payment;
  }

  async getMyPayments(passengerId: number) {
    const tickets = await db.orm.public.Ticket.all();
    const payments = await db.orm.public.Payment.all();

    const myTicketIds = tickets
      .filter((ticket) => ticket.passengerId === passengerId)
      .map((ticket) => ticket.id);

    return payments.filter(
      (payment) => myTicketIds.includes(payment.ticketId),
    );
  }

  
  async confirmTestPayment(paymentId: number, passengerId: number) {
    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      throw new BadRequestException('Valid payment ID is required');
    }

    const payments = await db.orm.public.Payment.all();
    const payment = payments.find((item) => item.id === paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const tickets = await db.orm.public.Ticket.all();
    const ticket = tickets.find((item) => item.id === payment.ticketId);

    if (!ticket || ticket.passengerId !== passengerId) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'SUCCESS' && ticket.status === 'ISSUED' && ticket.qrToken) {
      return { message: 'Payment already confirmed', payment, ticket };
    }

    if (payment.status !== 'PENDING' || ticket.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('Payment cannot be confirmed in its current state');
    }

    if (payment.provider !== 'TEST') {
      throw new BadRequestException('This endpoint only supports test payments');
    }

    const qrToken = `bt_${crypto.randomUUID()}`;

    // Update payment first, then issue the ticket.
    await db.orm.public.Payment.where({ id: paymentId }).update({
      status: 'SUCCESS',
    });

    await db.orm.public.Ticket.where({ id: ticket.id }).update({
      status: 'ISSUED',
      qrToken,
    });

    const updatedPayments = await db.orm.public.Payment.all();
    const updatedTickets = await db.orm.public.Ticket.all();

    return {
      message: 'Test payment confirmed and ticket issued',
      payment: updatedPayments.find((item) => item.id === paymentId),
      ticket: updatedTickets.find((item) => item.id === ticket.id),
    };
  }



  async verifyTicket(qrToken: string, conductorId: number) {
    if (
      typeof qrToken !== 'string' ||
      qrToken.trim() === ''
    ) {
      throw new BadRequestException('QR token is required');
    }

    const users = await db.orm.public.User.all();
    const conductor = users.find(
      (user) =>
        user.id === conductorId &&
        user.role === 'CONDUCTOR',
    );

    if (!conductor) {
      throw new ForbiddenException('Conductor access required');
    }

    const tickets = await db.orm.public.Ticket.all();
    const ticket = tickets.find(
      (item) => item.qrToken === qrToken.trim(),
    );

    if (!ticket) {
      throw new NotFoundException('Invalid QR ticket');
    }

    if (ticket.status !== 'ISSUED') {
      throw new BadRequestException('Ticket is not valid for travel');
    }

    if (ticket.usedAt) {
      throw new BadRequestException('Ticket has already been used');
    }

    const trips = await db.orm.public.Trip.all();
    const trip = trips.find(
      (item) => item.id === ticket.tripId,
    );

    if (!trip || trip.conductorId !== conductorId) {
      throw new ForbiddenException(
        'This ticket is not assigned to your trip',
      );
    }

    const usedAt = new Date();

    await db.orm.public.Ticket.where({
      id: ticket.id,
      usedAt: null,
    }).update({
      usedAt,
    });

    const updatedTickets = await db.orm.public.Ticket.all();
    const updatedTicket = updatedTickets.find(
      (item) => item.id === ticket.id,
    );

    if (!updatedTicket?.usedAt) {
      throw new BadRequestException(
        'Ticket verification failed; please retry',
      );
    }

    return {
      message: 'Ticket verified successfully',
      ticketId: updatedTicket.id,
      tripId: updatedTicket.tripId,
      status: updatedTicket.status,
      usedAt: updatedTicket.usedAt,
    };
  }





}
