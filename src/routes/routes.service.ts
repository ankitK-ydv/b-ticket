
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { db } from '../prisma/db.js';

@Injectable()
export class RoutesService {

  // Create route for logged-in owner
  async createRoute(data: any, ownerId: number) {
    const route = await db.orm.public.Route.create({
      name: data.name,
      code: data.code,
      ownerId: ownerId,
    });

    return route;
  }

  // Get routes belonging to this owner
  async getMyRoutes(ownerId: number) {
    const routes = await db.orm.public.Route.all();

    return routes.filter(
      (route) => route.ownerId === ownerId,
    );
  }

  // Get a specific route belonging to this owner
  async getRouteById(routeId: number, ownerId: number) {
    const routes = await db.orm.public.Route
      .where({
        id: routeId,
        ownerId: ownerId,
      })
      .all();

    const route = routes[0];

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return route;
  }
}
