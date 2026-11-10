import { Injectable ,  ForbiddenException,
  NotFoundException } from '@nestjs/common';
import { db } from '../prisma/db.js';


@Injectable()
export class BusService {

  async createBus(data: any, ownerId: number) {
    const bus = await db.orm.public.Bus.create({
      busNumber: data.busNumber,
      registrationNumber: data.registrationNumber,
      capacity: data.capacity,
      ownerId: ownerId,
    });

    return bus;
  }

  async getBuses(ownerId: number) {
    const buses = await db.orm.public.Bus.all();

    return buses.filter((bus) => bus.ownerId === ownerId);
  }


 async getMyBuses(ownerId: number) {
  const buses = await db.orm.public.Bus.all();

  const myBuses = buses.filter(
    (bus) => bus.ownerId === ownerId
  );

  return myBuses;
}

async getAllBuses() {
  const buses = await db.orm.public.Bus.all();

  return buses.map((bus) => ({
    id: bus.id,
    busNumber: bus.busNumber,
  }));
}

async getBusById(busId: number, ownerId: number) {
  const buses = await db.orm.public.Bus.all();

  const bus = buses.find((item) => item.id === busId);

  if (!bus) {
    throw new NotFoundException('Bus not found');
  }

  if (bus.ownerId !== ownerId) {
    throw new ForbiddenException('You are not the owner of this bus');
  }

  return bus;
}



async updateBus(
  busId: number,
  data: any,
  ownerId: number,
) {
  const buses = await db.orm.public.Bus
    .where({
      id: busId,
      ownerId: ownerId,
    })
    .all();

  if (!buses[0]) {
    throw new NotFoundException('Bus not found');
  }

  const updatedBus = await db.orm.public.Bus
    .where({
      id: busId,
      ownerId: ownerId,
    })
    .update({
      busNumber: data.busNumber,
      registrationNumber: data.registrationNumber,
      capacity: data.capacity,
    });

  return updatedBus;
}


async deleteBus(
  busId: number,
  ownerId: number,
) {
  const buses = await db.orm.public.Bus
    .where({
      id: busId,
      ownerId: ownerId,
    })
    .all();

  if (!buses[0]) {
    throw new NotFoundException('Bus not found');
  }

  await db.orm.public.Bus
    .where({
      id: busId,
      ownerId: ownerId,
    })
    .delete();

  return {
    message: 'Bus deleted successfully',
  };
}


}