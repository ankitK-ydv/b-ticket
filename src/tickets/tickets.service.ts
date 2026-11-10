
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,

} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { Temporal } from '@js-temporal/polyfill';
@Injectable()
export class TicketsService {
  async createTicket(data: any, passengerId: number) {
    const tripId = Number(data.tripId);
    const fromStopId = Number(data.fromStopId);
    const toStopId = Number(data.toStopId);

    if (
      !Number.isInteger(tripId) || tripId <= 0 ||
      !Number.isInteger(fromStopId) || fromStopId <= 0 ||
      !Number.isInteger(toStopId) || toStopId <= 0
    ) {
      throw new BadRequestException(
        'Valid tripId, fromStopId and toStopId are required',
      );
    }

    if (fromStopId === toStopId) {
      throw new BadRequestException(
        'Boarding and destination stops must be different',
      );
    }

    const trips = await db.orm.public.Trip.all();

const trip = trips.find(
  (item) => item.id === tripId,
);

if (!trip) {
  throw new NotFoundException('Trip not found');
}

if (trip.status === 'CANCELLED') {
  throw new BadRequestException(
    'This trip has been cancelled. Booking is not allowed.',
  );
}

if (trip.status !== 'SCHEDULED') {
  throw new BadRequestException(
    'This trip is not available for booking.',
  );
}

// Reject trips whose departure time has already passed
if (
  Temporal.Instant.compare(
    trip.departureTime,
    Temporal.Now.instant(),
  ) <= 0
) {
  throw new BadRequestException(
    'Trip departure time has already passed. Booking is not allowed.',
  );
}

    const routeStops = await db.orm.public.RouteStop.all();

    const orderedStops = routeStops
      .filter((item) => item.routeDirectionId === trip.routeDirectionId)
      .sort((a, b) => a.sequence - b.sequence);

    const fromIndex = orderedStops.findIndex(
      (item) => item.stopId === fromStopId,
    );
    const toIndex = orderedStops.findIndex(
      (item) => item.stopId === toStopId,
    );

    if (fromIndex === -1 || toIndex === -1) {
      throw new BadRequestException(
        'Both stops must belong to the trip route',
      );
    }

    if (fromIndex >= toIndex) {
      throw new BadRequestException(
        'Destination must come after boarding stop',
      );
    }

    const fares = await db.orm.public.Fare.all();
    let totalAmount = 0;

    for (let i = fromIndex; i < toIndex; i++) {
      const currentStop = orderedStops[i];
      const nextStop = orderedStops[i + 1];

      const segmentFare = fares.find(
        (item) =>
          item.routeDirectionId === trip.routeDirectionId &&
          item.fromStopId === currentStop.stopId &&
          item.toStopId === nextStop.stopId,
      );

      if (!segmentFare) {
        throw new NotFoundException(
          `Fare is not configured for segment ${currentStop.stopId} to ${nextStop.stopId}`,
        );
      }

      totalAmount += Number(segmentFare.amount);
    }

    totalAmount = Math.round((totalAmount + Number.EPSILON) * 100) / 100;

    return db.orm.public.Ticket.create({
      passengerId,
      tripId,
      fromStopId,
      toStopId,
      fareAmount: totalAmount,
      status: 'PENDING_PAYMENT',
      qrToken: null,
    });
  }


async getMyTickets(passengerId: number) {
  const tickets = await db.orm.public.Ticket.all();
  const trips = await db.orm.public.Trip.all();
  const buses = await db.orm.public.Bus.all();
  const directions = await db.orm.public.RouteDirection.all();
  const routes = await db.orm.public.Route.all();
  const stops = await db.orm.public.Stop.all();
  const payments = await db.orm.public.Payment.all();

  const myTickets = tickets.filter(
    (ticket) => ticket.passengerId === passengerId,
  );

  return myTickets.map((ticket) => {
    const trip = trips.find(
      (item) => item.id === ticket.tripId,
    );

    const bus = buses.find(
      (item) => item.id === trip?.busId,
    );

    const direction = directions.find(
      (item) => item.id === trip?.routeDirectionId,
    );

    const route = routes.find(
      (item) => item.id === direction?.routeId,
    );

    const fromStop = stops.find(
      (item) => item.id === ticket.fromStopId,
    );

    const toStop = stops.find(
      (item) => item.id === ticket.toStopId,
    );

    const payment = payments.find(
      (item) => item.ticketId === ticket.id,
    );

    return {
      ...ticket,

      trip: trip
        ? {
            id: trip.id,
            departureTime: trip.departureTime,
            status: trip.status,
          }
        : null,

      bus: bus
        ? {
            busNumber: bus.busNumber,
            registrationNumber: bus.registrationNumber,
          }
        : null,

      route: route
        ? {
            name: route.name,
            code: route.code,
          }
        : null,

      routeDirection: direction
        ? {
            name: direction.name,
            code: direction.code,
          }
        : null,

      fromStop: fromStop
        ? {
            id: fromStop.id,
            name: fromStop.name,
          }
        : null,

      toStop: toStop
        ? {
            id: toStop.id,
            name: toStop.name,
          }
        : null,

      payment: payment
        ? {
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
          }
        : null,
    };
  });
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
      throw new BadRequestException(
        'Ticket is not valid for travel',
      );
    }

    if (ticket.usedAt) {
      throw new BadRequestException(
        'Ticket has already been used',
      );
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

   const usedAt = Temporal.Now.instant();

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




  
async getConductorVerificationHistory(conductorId: number) {
  if (!Number.isInteger(conductorId) || conductorId <= 0) {
    throw new BadRequestException('Valid conductor ID is required');
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
  const trips = await db.orm.public.Trip.all();
  const buses = await db.orm.public.Bus.all();
  const directions = await db.orm.public.RouteDirection.all();
  const routes = await db.orm.public.Route.all();
  const stops = await db.orm.public.Stop.all();

  const history = tickets
    .filter((ticket) => ticket.usedAt !== null)
    .map((ticket) => {
      const trip = trips.find(
        (item) => item.id === ticket.tripId,
      );

      // Only show tickets from trips assigned to this conductor.
      if (!trip || trip.conductorId !== conductorId) {
        return null;
      }

      const bus = buses.find(
        (item) => item.id === trip.busId,
      );

      const direction = directions.find(
        (item) => item.id === trip.routeDirectionId,
      );

      const route = routes.find(
        (item) => item.id === direction?.routeId,
      );

      const fromStop = stops.find(
        (item) => item.id === ticket.fromStopId,
      );

      const toStop = stops.find(
        (item) => item.id === ticket.toStopId,
      );

      return {
        ticketId: ticket.id,
        tripId: ticket.tripId,
        fareAmount: ticket.fareAmount,
        ticketStatus: ticket.status,
        usedAt: ticket.usedAt,

        bus: bus
          ? {
              busNumber: bus.busNumber,
              registrationNumber: bus.registrationNumber,
            }
          : null,

        route: route
          ? {
              name: route.name,
              code: route.code,
            }
          : null,

        fromStop: fromStop?.name ?? null,
        toStop: toStop?.name ?? null,
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) =>
      Temporal.Instant.compare(b.usedAt, a.usedAt),
    );

  return {
    totalVerifiedTickets: history.length,
    history,
  };
}


  
}
