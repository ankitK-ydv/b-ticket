
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { db } from '../prisma/db.js';

@Injectable()
export class RouteStopsService {
  async addStop(data: any, ownerId: number) {
    const routeId = Number(data.routeId);
    const routeDirectionId = Number(data.routeDirectionId);
    const stopId = Number(data.stopId);
    const sequence = Number(data.sequence);

    if (
      !Number.isInteger(routeId) || routeId <= 0 ||
      !Number.isInteger(routeDirectionId) || routeDirectionId <= 0 ||
      !Number.isInteger(stopId) || stopId <= 0 ||
      !Number.isInteger(sequence) || sequence <= 0
    ) {
      throw new BadRequestException(
        'Valid routeId, routeDirectionId, stopId and sequence are required',
      );
    }

    const routes = await db.orm.public.Route.all();
    const route = routes.find(
      (item) => item.id === routeId && item.ownerId === ownerId,
    );

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const directions = await db.orm.public.RouteDirection.all();
    const direction = directions.find(
      (item) => item.id === routeDirectionId && item.routeId === routeId,
    );

    if (!direction) {
      throw new NotFoundException('Route direction not found for this route');
    }

    const stops = await db.orm.public.Stop.all();

    if (!stops.some((item) => item.id === stopId)) {
      throw new NotFoundException('Stop not found');
    }

    const routeStops = await db.orm.public.RouteStop.all();

    if (
      routeStops.some(
        (item) =>
          item.routeDirectionId === routeDirectionId &&
          item.sequence === sequence,
      )
    ) {
      throw new BadRequestException(
        'This sequence number is already used in the direction',
      );
    }

    if (
      routeStops.some(
        (item) =>
          item.routeDirectionId === routeDirectionId &&
          item.stopId === stopId,
      )
    ) {
      throw new BadRequestException(
        'This stop is already added to the direction',
      );
    }

    return db.orm.public.RouteStop.create({
      routeDirectionId,
      stopId,
      sequence,
    });
  }

  async getOrderedStops(routeDirectionId: number, ownerId: number) {
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
    const stops = await db.orm.public.Stop.all();

    return routeStops
      .filter((item) => item.routeDirectionId === routeDirectionId)
      .sort((a, b) => a.sequence - b.sequence)
      .map((item) => {
        const originalStop = stops.find(
          (stop) => stop.id === item.stopId,
        );

        return {
          id: item.id,
          routeDirectionId: item.routeDirectionId,
          stopId: item.stopId,

          // Effective values: custom value first, shared catalogue fallback.
          stopName: item.customName ?? originalStop?.name ?? null,
          stopCode: item.customCode ?? originalStop?.code ?? null,

          // Original catalogue values are also returned.
          originalStopName: originalStop?.name ?? null,
          originalStopCode: originalStop?.code ?? null,

          customName: item.customName,
          customCode: item.customCode,
          sequence: item.sequence,
        };
      });
  }

  async updateStop(
    routeStopId: number,
    data: any,
    ownerId: number,
  ) {
    const hasCustomName = Object.prototype.hasOwnProperty.call(
      data,
      'customName',
    );
    const hasCustomCode = Object.prototype.hasOwnProperty.call(
      data,
      'customCode',
    );

    if (!hasCustomName && !hasCustomCode) {
      throw new BadRequestException(
        'At least customName or customCode is required',
      );
    }

    const updateData: {
      customName?: string | null;
      customCode?: string | null;
    } = {};

    if (hasCustomName) {
      if (data.customName === null) {
        updateData.customName = null;
      } else if (
        typeof data.customName === 'string' &&
        data.customName.trim().length > 0
      ) {
        updateData.customName = data.customName.trim();
      } else {
        throw new BadRequestException(
          'customName must be a non-empty string or null',
        );
      }
    }

    if (hasCustomCode) {
      if (data.customCode === null) {
        updateData.customCode = null;
      } else if (
        typeof data.customCode === 'string' &&
        data.customCode.trim().length > 0
      ) {
        updateData.customCode = data.customCode.trim().toUpperCase();
      } else {
        throw new BadRequestException(
          'customCode must be a non-empty string or null',
        );
      }
    }

    const routeStops = await db.orm.public.RouteStop.all();
    const routeStop = routeStops.find(
      (item) => item.id === routeStopId,
    );

    if (!routeStop) {
      throw new NotFoundException('Stop assignment not found');
    }

    const directions = await db.orm.public.RouteDirection.all();
    const direction = directions.find(
      (item) => item.id === routeStop.routeDirectionId,
    );

    if (!direction) {
      throw new NotFoundException('Route direction not found');
    }

    const routes = await db.orm.public.Route.all();
    const route = routes.find(
      (item) =>
        item.id === direction.routeId &&
        item.ownerId === ownerId,
    );

    if (!route) {
      throw new NotFoundException('Stop assignment not found');
    }

    await db.orm.public.RouteStop
      .where({ id: routeStopId })
      .update(updateData);

    const updatedRouteStops = await db.orm.public.RouteStop.all();
    const updatedStop = updatedRouteStops.find(
      (item) => item.id === routeStopId,
    );

    const stops = await db.orm.public.Stop.all();
    const originalStop = stops.find(
      (item) => item.id === routeStop.stopId,
    );

    return {
      message: 'Stop updated successfully for this direction',
      id: routeStopId,
      stopId: routeStop.stopId,
      customName: updatedStop?.customName ?? null,
      customCode: updatedStop?.customCode ?? null,
      stopName:
        updatedStop?.customName ?? originalStop?.name ?? null,
      stopCode:
        updatedStop?.customCode ?? originalStop?.code ?? null,
    };
  }

  async removeStop(routeStopId: number, ownerId: number) {
    const routeStops = await db.orm.public.RouteStop.all();
    const routeStop = routeStops.find(
      (item) => item.id === routeStopId,
    );

    if (!routeStop) {
      throw new NotFoundException('Stop assignment not found');
    }

    const directions = await db.orm.public.RouteDirection.all();
    const direction = directions.find(
      (item) => item.id === routeStop.routeDirectionId,
    );

    if (!direction) {
      throw new NotFoundException('Route direction not found');
    }

    const routes = await db.orm.public.Route.all();
    const route = routes.find(
      (item) =>
        item.id === direction.routeId &&
        item.ownerId === ownerId,
    );

    if (!route) {
      throw new NotFoundException('Stop assignment not found');
    }

    // Remove fares involving this stop in this direction.
    const fares = await db.orm.public.Fare.all();
    const relatedFares = fares.filter(
      (fare) =>
        fare.routeDirectionId === routeStop.routeDirectionId &&
        (
          fare.fromStopId === routeStop.stopId ||
          fare.toStopId === routeStop.stopId
        ),
    );

    for (const fare of relatedFares) {
      await db.orm.public.Fare
        .where({ id: fare.id })
        .delete();
    }

    // Remove only this direction's stop assignment.
    await db.orm.public.RouteStop
      .where({ id: routeStopId })
      .delete();

    // Close the sequence gap after deletion.
    const remainingStops = await db.orm.public.RouteStop.all();
    const orderedRemaining = remainingStops
      .filter(
        (item) =>
          item.routeDirectionId === routeStop.routeDirectionId,
      )
      .sort((a, b) => a.sequence - b.sequence);

    for (let index = 0; index < orderedRemaining.length; index++) {
      const item = orderedRemaining[index];
      const newSequence = index + 1;

      if (item.sequence !== newSequence) {
        await db.orm.public.RouteStop
          .where({ id: item.id })
          .update({ sequence: newSequence });
      }
    }

    return {
      message: 'Stop removed from this direction successfully',
      removedStopId: routeStop.stopId,
      removedFares: relatedFares.length,
    };
  }
}
