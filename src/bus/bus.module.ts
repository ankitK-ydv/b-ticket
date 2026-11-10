import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BusController } from './bus.controller.js';
import { BusService } from './bus.service.js';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not configured in environment variables');
}

@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret,
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  controllers: [BusController],
  providers: [BusService],
})
export class BusModule {}