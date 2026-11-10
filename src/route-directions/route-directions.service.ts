
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';

@Injectable()
export class RouteDirectionsService {
 
async createDirection(data: any, ownerId: number) {
  const routeId = Number(data.routeId);

  // Validate input first
  if (
    !Number.isInteger(routeId) ||
    routeId <= 0 ||
    typeof data.name !== 'string' ||
    !data.name.trim() ||
    typeof data.code !== 'string' ||
    !data.code.trim()
  ) {
    throw new BadRequestException(
      'Valid routeId, name and code are required',
    );
  }

  // Verify route ownership
  const routes = await db.orm.public.Route.all();

  const route = routes.find(
    (item) => item.id === routeId &&
              item.ownerId === ownerId,
  );

  if (!route) {
    throw new NotFoundException('Route not found');
  }

  // Check unique direction code
  const directions = await db.orm.public.RouteDirection.all();

  if (
    directions.some(
      (item) => item.code === data.code.trim(),
    )
  ) {
    throw new BadRequestException(
      'Direction code already exists',
    );
  }

  return db.orm.public.RouteDirection.create({
    routeId,
    name: data.name.trim(),
    code: data.code.trim(),
  });
}


  async getDirectionsByRoute(routeId: number, ownerId: number) {
    const routes = await db.orm.public.Route.all();
    const route = routes.find((item) => item.id === routeId);

    if (!route || route.ownerId !== ownerId) {
      throw new NotFoundException('Route not found');
    }

    const directions = await db.orm.public.RouteDirection.all();

    return directions.filter(
      (item) => item.routeId === routeId,
    );
  }
}
