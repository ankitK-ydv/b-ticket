import { Injectable, UnauthorizedException , BadRequestException } from '@nestjs/common';
import { db } from '../prisma/db.js';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(private readonly jwtService: JwtService) {}
  testAuth() {
    return 'Auth service is working!';
  }


async getUsers() {
  const users = await db.orm.public.User.all();

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  }));
}




 
async register(data: any) {
  if (
    !data.name ||
    !data.email ||
    !data.password ||
    !data.phone
  ) {
    throw new BadRequestException(
      'Name, email, password and phone are required',
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await db.orm.public.User.create({
    name: data.name,
    email: data.email,
    passwordHash,
    phone: data.phone,
    role: 'PASSENGER',
  });

  const { passwordHash: _, ...safeUser } = user;

  return safeUser;
}

async login(data: any) {
  const identifier = data.emailOrPhone?.trim()

  if (!identifier || !data.password) {
    throw new BadRequestException(
      'Email or phone number and password are required',
    )
  }

  const users = await db.orm.public.User.all()

  const user = users.find(
    (user: any) =>
      user.email === identifier ||
      user.phone === identifier,
  )

  if (!user) {
    throw new UnauthorizedException('Invalid email/phone or password')
  }

  if (!user) {
    throw new UnauthorizedException('Invalid email/phone or password')
  }

  if (user.isActive === false) {
    throw new UnauthorizedException(
      'Your account has been deactivated. Please contact your bus owner.',
    )
  }

  const passwordMatch = await bcrypt.compare(
    data.password,
    user.passwordHash,
  )

  if (!passwordMatch) {
    throw new UnauthorizedException('Invalid email/phone or password')
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  }

  const token = await this.jwtService.signAsync(payload)

  return {
    message: 'Login successful',
    accessToken: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  }
}


  

async createConductor(data: any, ownerId: number) {
  if (
    !data.name ||
    !data.email ||
    !data.password ||
    !data.phone
  ) {
    throw new BadRequestException(
      'Name, email, password and phone are required',
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await db.orm.public.User.create({
    name: data.name,
    email: data.email,
    passwordHash,
    phone: data.phone,
    role: 'CONDUCTOR',
    ownerId: ownerId,
  });

  const { passwordHash: _, ...safeUser } = user;

  return safeUser;
}





async getMyConductors(ownerId: number) {
  const users = await db.orm.public.User.all();

  return users
    .filter(
      (user) =>
        user.role === 'CONDUCTOR' &&
        user.ownerId === ownerId,
    )
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
    }));
}



async updateConductorStatus(
  conductorId: number,
  ownerId: number,
  isActive: boolean,
) {
  if (!Number.isInteger(conductorId) || conductorId <= 0) {
    throw new BadRequestException('Valid conductor ID is required');
  }

  const users = await db.orm.public.User.all();

  const conductor = users.find(
    (user) =>
      user.id === conductorId &&
      user.role === 'CONDUCTOR' &&
      user.ownerId === ownerId,
  );

  if (!conductor) {
    throw new BadRequestException('Conductor not found');
  }

const updated = await db.orm.public.User
  .where({ id: conductorId })
  .update({ isActive });

if (!updated) {
  throw new BadRequestException('Unable to update conductor status');
}

return {
  id: updated.id,
  name: updated.name,
  email: updated.email,
  phone: updated.phone,
  isActive: updated.isActive,
};
}




async getProfile(userId: number) {
  const users = await db.orm.public.User.all()

  const user = users.find(
    (item: any) => item.id === userId,
  )

  if (!user) {
    throw new UnauthorizedException('User not found')
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  }
}

}
