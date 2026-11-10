
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { Temporal } from '@js-temporal/polyfill';
@Injectable()
export class FaresService {
  async createFare(data: any, ownerId: number) {
    const routeDirectionId = Number(data.routeDirectionId);
    const fromStopId = Number(data.fromStopId);
    const toStopId = Number(data.toStopId);
    const amount = Number(data.amount);

    if (
      !Number.isInteger(routeDirectionId) ||
      routeDirectionId <= 0 ||
      !Number.isInteger(fromStopId) ||
      fromStopId <= 0 ||
      !Number.isInteger(toStopId) ||
      toStopId <= 0 ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new BadRequestException(
        'Valid routeDirectionId, fromStopId, toStopId and positive amount are required',
      );
    }

    if (fromStopId === toStopId) {
      throw new BadRequestException(
        'Boarding and destination stops must be different',
      );
    }

    const directions = await db.orm.public.RouteDirection.all();
    const direction = directions.find(
      (item) => item.id === routeDirectionId,
    );

    if (!direction) {
      throw new NotFoundException('Route direction not found');
    }

    const routes = await db.orm.public.Route.all();
    const route = routes.find(
      (item) => item.id === direction.routeId,
    );

    if (!route || route.ownerId !== ownerId) {
      throw new NotFoundException('Route direction not found');
    }

    const routeStops = await db.orm.public.RouteStop.all();

    const fromRouteStop = routeStops.find(
      (item) =>
        item.routeDirectionId === routeDirectionId &&
        item.stopId === fromStopId,
    );

    const toRouteStop = routeStops.find(
      (item) =>
        item.routeDirectionId === routeDirectionId &&
        item.stopId === toStopId,
    );

    if (!fromRouteStop || !toRouteStop) {
      throw new BadRequestException(
        'Both stops must belong to this route direction',
      );
    }

    if (fromRouteStop.sequence >= toRouteStop.sequence) {
      throw new BadRequestException(
        'Destination must come after boarding stop in this direction',
      );
    }

    const fares = await db.orm.public.Fare.all();

    if (
      fares.some(
        (item) =>
          item.routeDirectionId === routeDirectionId &&
          item.fromStopId === fromStopId &&
          item.toStopId === toStopId,
      )
    ) {
      throw new BadRequestException(
        'Fare already exists for this stop pair',
      );
    }

    return db.orm.public.Fare.create({
      routeDirectionId,
      fromStopId,
      toStopId,
      amount,
    });
  }

  async getFaresByDirection(
    routeDirectionId: number,
    ownerId: number,
  ) {
    const directions = await db.orm.public.RouteDirection.all();

    const direction = directions.find(
      (item) => item.id === routeDirectionId,
    );

    if (!direction) {
      throw new NotFoundException('Route direction not found');
    }

    const routes = await db.orm.public.Route.all();
    const route = routes.find(
      (item) => item.id === direction.routeId,
    );

    if (!route || route.ownerId !== ownerId) {
      throw new NotFoundException('Route direction not found');
    }

    const fares = await db.orm.public.Fare.all();
    const stops = await db.orm.public.Stop.all();

    return fares
      .filter(
        (item) => item.routeDirectionId === routeDirectionId,
      )
      .map((item) => ({
        ...item,
        fromStopName:
          stops.find((stop) => stop.id === item.fromStopId)?.name ?? null,
        toStopName:
          stops.find((stop) => stop.id === item.toStopId)?.name ?? null,
      }));


  }


async updateFare(
  fareId: number,
  data: any,
  ownerId: number,
) {
  const amount = Number(data.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException(
      'Fare amount must be a valid positive number',
    );
  }

  // Find existing fare
  const fares = await db.orm.public.Fare.all();

  const existingFare = fares.find(
    (item) => item.id === fareId,
  );

  if (!existingFare) {
    throw new NotFoundException('Fare not found');
  }

  // Verify direction ownership
  const directions =
    await db.orm.public.RouteDirection.all();

  const direction = directions.find(
    (item) => item.id === existingFare.routeDirectionId,
  );

  if (!direction) {
    throw new NotFoundException('Fare not found');
  }

  const routes = await db.orm.public.Route.all();

  const route = routes.find(
    (item) => item.id === direction.routeId,
  );

  if (!route || route.ownerId !== ownerId) {
    throw new NotFoundException('Fare not found');
  }

  // Update only the amount
  await db.orm.public.Fare
    .where({ id: fareId })
    .update({ amount });

  // Return updated fare
  const updatedFares = await db.orm.public.Fare.all();

  return updatedFares.find(
    (item) => item.id === fareId,
  );
}


  
async calculateFare(data: any) {
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
const trip = trips.find((item) => item.id === tripId);

if (!trip || trip.status !== 'SCHEDULED') {
  throw new NotFoundException('Available trip not found');
}

// Reject trips whose departure time has already passed
if (
  Temporal.Instant.compare(
    trip.departureTime,
    Temporal.Now.instant(),
  ) <= 0
) {
  throw new BadRequestException(
    'Trip departure time has already passed',
  );
}

  const routeDirectionId = trip.routeDirectionId;

  const routeStops = await db.orm.public.RouteStop.all();

  const orderedStops = routeStops
    .filter((item) => item.routeDirectionId === routeDirectionId)
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
  const segments: {
    fromStopId: number;
    toStopId: number;
    amount: number;
  }[] = [];

  for (let i = fromIndex; i < toIndex; i++) {
    const currentStop = orderedStops[i];
    const nextStop = orderedStops[i + 1];

    const segmentFare = fares.find(
      (item) =>
        item.routeDirectionId === routeDirectionId &&
        item.fromStopId === currentStop.stopId &&
        item.toStopId === nextStop.stopId,
    );

    if (!segmentFare) {
      throw new NotFoundException(
        `Fare is not configured for segment ${currentStop.stopId} to ${nextStop.stopId}`,
      );
    }

    totalAmount += Number(segmentFare.amount);

    segments.push({
      fromStopId: currentStop.stopId,
      toStopId: nextStop.stopId,
      amount: Number(segmentFare.amount),
    });
  }

  totalAmount = Math.round((totalAmount + Number.EPSILON) * 100) / 100;

  return {
    tripId,
    routeDirectionId,
    fromStopId,
    toStopId,
    segments,
    amount: totalAmount,
  };
}

}
