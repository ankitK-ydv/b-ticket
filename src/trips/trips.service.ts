
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { Temporal } from '@js-temporal/polyfill';

@Injectable()
export class TripsService {
  async createTrip(data: any, ownerId: number) {
    const busId = Number(data.busId);
    const routeDirectionId = Number(data.routeDirectionId);
   

    if (
      !Number.isInteger(busId) ||
      busId <= 0 ||
      !Number.isInteger(routeDirectionId) ||
      routeDirectionId <= 0
    ) {
      throw new BadRequestException(
        'Valid busId and routeDirectionId are required',
      );
    }

   
if (
  typeof data.departureTime !== 'string' ||
  data.departureTime.trim() === ''
) {
  throw new BadRequestException(
    'A valid departureTime is required',
  );
}

let departureTime: Temporal.Instant;

try {
  departureTime = Temporal.Instant.from(data.departureTime);
} catch {
  throw new BadRequestException(
    'A valid departureTime is required',
  );
}

if (
  Temporal.Instant.compare(
    departureTime,
    Temporal.Now.instant(),
  ) <= 0
) {
  throw new BadRequestException(
    'Departure time must be in the future',
  );
}


    const buses = await db.orm.public.Bus.all();
    const bus = buses.find((item) => item.id === busId);

    if (!bus || bus.ownerId !== ownerId) {
      throw new NotFoundException('Bus not found');
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

    return db.orm.public.Trip.create({
      busId,
      routeDirectionId,
      departureTime,
      status: 'SCHEDULED',
    });
  }

  async getMyTrips(ownerId: number) {
    const trips = await db.orm.public.Trip.all();
    const buses = await db.orm.public.Bus.all();
    const directions = await db.orm.public.RouteDirection.all();
    const routes = await db.orm.public.Route.all();

    return trips
      .filter((trip) => {
        const bus = buses.find((item) => item.id === trip.busId);
        const direction = directions.find(
          (item) => item.id === trip.routeDirectionId,
        );
        const route = routes.find(
          (item) => item.id === direction?.routeId,
        );

        return bus?.ownerId === ownerId && route?.ownerId === ownerId;
      })
      .sort((a, b) =>
  Temporal.Instant.compare(
    a.departureTime,
    b.departureTime,
  ),
);
  }

  async getTripById(tripId: number, ownerId: number) {
  if (!Number.isInteger(tripId) || tripId <= 0) {
    throw new BadRequestException('Valid trip ID is required');
  }

  const trips = await db.orm.public.Trip.all();

  const trip = trips.find((item) => item.id === tripId);

  if (!trip) {
    throw new NotFoundException('Trip not found');
  }

  const buses = await db.orm.public.Bus.all();

  const bus = buses.find((item) => item.id === trip.busId);

  if (!bus || bus.ownerId !== ownerId) {
    throw new NotFoundException('Trip not found');
  }

  const directions = await db.orm.public.RouteDirection.all();

  const direction = directions.find(
    (item) => item.id === trip.routeDirectionId,
  );

  if (!direction) {
    throw new NotFoundException('Route direction not found');
  }

  const routes = await db.orm.public.Route.all();

  const route = routes.find(
    (item) => item.id === direction.routeId,
  );

  if (!route || route.ownerId !== ownerId) {
    throw new NotFoundException('Trip not found');
  }

  return {
    ...trip,
    bus: {
      id: bus.id,
      busNumber: bus.busNumber,
      registrationNumber: bus.registrationNumber,
      capacity: bus.capacity,
    },
    route: {
      id: route.id,
      name: route.name,
      code: route.code,
    },
    routeDirection: {
      id: direction.id,
      name: direction.name,
      code: direction.code,
    },
  };
}


  
async assignConductor(
  tripId: number,
  conductorId: number,
  ownerId: number,
) {
  if (
    !Number.isInteger(tripId) || tripId <= 0 ||
    !Number.isInteger(conductorId) || conductorId <= 0
  ) {
    throw new BadRequestException(
      'Valid tripId and conductorId are required',
    );
  }

  const trips = await db.orm.public.Trip.all();
  const trip = trips.find((item) => item.id === tripId);

  if (!trip) {
    throw new NotFoundException('Trip not found');
  }

  const buses = await db.orm.public.Bus.all();
  const bus = buses.find((item) => item.id === trip.busId);

  if (!bus || bus.ownerId !== ownerId) {
    throw new NotFoundException('Trip not found');
  }

  const directions = await db.orm.public.RouteDirection.all();
  const direction = directions.find(
    (item) => item.id === trip.routeDirectionId,
  );

  const routes = await db.orm.public.Route.all();
  const route = routes.find(
    (item) => item.id === direction?.routeId,
  );

  if (!route || route.ownerId !== ownerId) {
    throw new NotFoundException('Trip not found');
  }

  const users = await db.orm.public.User.all();
const conductor = users.find(
  (item) =>
    item.id === conductorId &&
    item.role === 'CONDUCTOR' &&
    item.isActive === true &&
    item.ownerId === ownerId,
);

if (!conductor) {
  throw new NotFoundException(
    'Active conductor not found for this owner',
  );
}

  if (!conductor) {
    throw new NotFoundException(
      'Active conductor not found',
    );
  }

  if (trip.status !== 'SCHEDULED') {
    throw new BadRequestException(
      'Only scheduled trips can be assigned',
    );
  }

  return db.orm.public.Trip.where({ id: tripId }).update({
    conductorId,
  });
}




async cancelTrip(
  tripId: number,
  ownerId: number,
) {
  if (!Number.isInteger(tripId) || tripId <= 0) {
    throw new BadRequestException(
      'Valid trip ID is required',
    );
  }

  // Find trip
  const trips = await db.orm.public.Trip.all();

  const trip = trips.find(
    (item) => item.id === tripId,
  );

  if (!trip) {
    throw new NotFoundException('Trip not found');
  }

  // Verify bus ownership
  const buses = await db.orm.public.Bus.all();

  const bus = buses.find(
    (item) => item.id === trip.busId,
  );

  if (!bus || bus.ownerId !== ownerId) {
    throw new NotFoundException('Trip not found');
  }

  // Verify route direction
  const directions =
    await db.orm.public.RouteDirection.all();

  const direction = directions.find(
    (item) => item.id === trip.routeDirectionId,
  );

  if (!direction) {
    throw new NotFoundException('Trip not found');
  }

  // Verify route ownership
  const routes = await db.orm.public.Route.all();

  const route = routes.find(
    (item) => item.id === direction.routeId,
  );

  if (!route || route.ownerId !== ownerId) {
    throw new NotFoundException('Trip not found');
  }

  // Validate trip status
  if (trip.status !== 'SCHEDULED') {
    throw new BadRequestException(
      'Only scheduled trips can be cancelled',
    );
  }

  return db.orm.public.Trip.where({
    id: tripId,
  }).update({
    status: 'CANCELLED',
  });
}


 
async getAssignedTrips(conductorId: number) {
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
    throw new NotFoundException('Conductor not found');
  }

  const trips = await db.orm.public.Trip.all();
  const buses = await db.orm.public.Bus.all();
  const directions = await db.orm.public.RouteDirection.all();
  const routes = await db.orm.public.Route.all();

  const assignedTrips = trips
    .filter(
      (trip) =>
        trip.conductorId === conductorId &&
        trip.status !== 'CANCELLED',
    )
    .sort((a, b) =>
      Temporal.Instant.compare(
        a.departureTime,
        b.departureTime,
      ),
    );

  return assignedTrips.map((trip) => {
    const bus = buses.find(
      (item) => item.id === trip.busId,
    );

    const direction = directions.find(
      (item) => item.id === trip.routeDirectionId,
    );

    const route = routes.find(
      (item) => item.id === direction?.routeId,
    );

    return {
      id: trip.id,
      departureTime: trip.departureTime,
      status: trip.status,
      conductorId: trip.conductorId,

      bus: bus
        ? {
            id: bus.id,
            busNumber: bus.busNumber,
            registrationNumber: bus.registrationNumber,
          }
        : null,

      route: route
        ? {
            id: route.id,
            name: route.name,
            code: route.code,
          }
        : null,

      routeDirection: direction
        ? {
            id: direction.id,
            name: direction.name,
            code: direction.code,
          }
        : null,
    };
  });
}




async getAvailableTrips(data: any) {
  const fromStopId = Number(data.fromStopId);
  const toStopId = Number(data.toStopId);
  const date = data.date;

  if (
    !Number.isInteger(fromStopId) || fromStopId <= 0 ||
    !Number.isInteger(toStopId) || toStopId <= 0
  ) {
    throw new BadRequestException(
      'Valid boarding and destination stop IDs are required',
    );
  }

  if (fromStopId === toStopId) {
    throw new BadRequestException(
      'Boarding and destination stops must be different',
    );
  }

  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new BadRequestException(
      'Date must be in YYYY-MM-DD format',
    );
  }

  let startOfDay: Temporal.Instant;
  let endOfDay: Temporal.Instant;

  try {
    const plainDate = Temporal.PlainDate.from(date);

    if (plainDate.toString() !== date) {
      throw new Error('Invalid date');
    }

    startOfDay = plainDate
      .toZonedDateTime('Asia/Kolkata')
      .toInstant();

    endOfDay = plainDate
      .add({ days: 1 })
      .toZonedDateTime('Asia/Kolkata')
      .toInstant();
  } catch {
    throw new BadRequestException('Invalid calendar date');
  }

  const now = Temporal.Now.instant();

  const stops = await db.orm.public.Stop.all();

  const fromStop = stops.find((stop) => stop.id === fromStopId);
  const toStop = stops.find((stop) => stop.id === toStopId);

  if (!fromStop || !toStop) {
    throw new NotFoundException('Stop not found');
  }

  const routeStops = await db.orm.public.RouteStop.all();

  const directions = await db.orm.public.RouteDirection.all();
  const buses = await db.orm.public.Bus.all();
  const routes = await db.orm.public.Route.all();
  const trips = await db.orm.public.Trip.all();
  const fares = await db.orm.public.Fare.all();

  const results = [];

  for (const direction of directions) {
    const orderedStops = routeStops
      .filter((item) => item.routeDirectionId === direction.id)
      .sort((a, b) => a.sequence - b.sequence);

    const fromIndex = orderedStops.findIndex(
      (item) => item.stopId === fromStopId,
    );

    const toIndex = orderedStops.findIndex(
      (item) => item.stopId === toStopId,
    );

    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
      continue;
    }

    let totalFare = 0;
    let fareConfigured = true;

    for (let i = fromIndex; i < toIndex; i++) {
      const segmentFare = fares.find(
        (fare) =>
          fare.routeDirectionId === direction.id &&
          fare.fromStopId === orderedStops[i].stopId &&
          fare.toStopId === orderedStops[i + 1].stopId,
      );

      if (!segmentFare) {
        fareConfigured = false;
        break;
      }

      totalFare += Number(segmentFare.amount);
    }

    if (!fareConfigured) continue;

    totalFare = Math.round((totalFare + Number.EPSILON) * 100) / 100;

    const route = routes.find((item) => item.id === direction.routeId);

    if (!route) continue;

    const directionTrips = trips.filter((trip) => {
      const departure = trip.departureTime;

      return (
        trip.routeDirectionId === direction.id &&
        trip.status === 'SCHEDULED' &&
        Temporal.Instant.compare(departure, startOfDay) >= 0 &&
        Temporal.Instant.compare(departure, endOfDay) < 0 &&
        Temporal.Instant.compare(departure, now) > 0
      );
    });

    for (const trip of directionTrips) {
      const bus = buses.find((item) => item.id === trip.busId);

      if (!bus) continue;

      results.push({
        tripId: trip.id,
        departureTime: trip.departureTime,
        bus: {
          id: bus.id,
          busNumber: bus.busNumber,
          registrationNumber: bus.registrationNumber,
        },
        route: {
          id: route.id,
          name: route.name,
          code: route.code,
        },
        routeDirection: {
          id: direction.id,
          name: direction.name,
          code: direction.code,
        },
        fromStop,
        toStop,
        fare: totalFare,
      });
    }
  }

  return results.sort((a, b) =>
    Temporal.Instant.compare(a.departureTime, b.departureTime),
  );
}



}
