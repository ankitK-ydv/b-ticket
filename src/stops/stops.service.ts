
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { db } from '../prisma/db.js';

@Injectable()
export class StopsService {
  async createStop(data: any) {
    const name = String(data.name ?? '').trim();
    const code = String(data.code ?? '').trim().toUpperCase();

    if (!name || !code) {
      throw new BadRequestException(
        'Stop name and code are required',
      );
    }

    const stops = await db.orm.public.Stop.all();

    if (stops.some((item) => item.code === code)) {
      throw new ConflictException('Stop code already exists');
    }

    return db.orm.public.Stop.create({
      name,
      code,
    });
  }

  async getAllStops() {
    return db.orm.public.Stop.all();
  }

  async getStopById(stopId: number) {
    const stops = await db.orm.public.Stop.all();

    const stop = stops.find((item) => item.id === stopId);

    if (!stop) {
      throw new NotFoundException('Stop not found');
    }

    return stop;
  }

  async updateStop(
    stopId: number,
    data: any,
    ownerId: number,
  ) {
    const name = String(data.name ?? '').trim();
    const code = String(data.code ?? '').trim().toUpperCase();

    if (!name || !code) {
      throw new BadRequestException(
        'Stop name and code are required',
      );
    }

    const stops = await db.orm.public.Stop.all();
    const stop = stops.find((item) => item.id === stopId);

    if (!stop) {
      throw new NotFoundException('Stop not found');
    }

    // Verify that this stop is used in one of this owner's routes.
    const routeStops = await db.orm.public.RouteStop.all();
    const directions = await db.orm.public.RouteDirection.all();
    const routes = await db.orm.public.Route.all();

    const ownerUsesStop = routeStops.some((routeStop) => {
      if (routeStop.stopId !== stopId) return false;

      const direction = directions.find(
        (item) => item.id === routeStop.routeDirectionId,
      );

      if (!direction) return false;

      const route = routes.find(
        (item) => item.id === direction.routeId,
      );

      return route?.ownerId === ownerId;
    });

    if (!ownerUsesStop) {
      throw new NotFoundException('Stop not found in your routes');
    }

    const duplicateCode = stops.some(
      (item) => item.id !== stopId && item.code === code,
    );

    if (duplicateCode) {
      throw new ConflictException('Stop code already exists');
    }

    await db.orm.public.Stop
      .where({ id: stopId })
      .update({ name, code });

    return this.getStopById(stopId);
  }
}
