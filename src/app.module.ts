import { Module } from '@nestjs/common';
import { BusModule } from './bus/bus.module.js';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { StopsModule } from './stops/stops.module.js';
import { RoutesModule } from './routes/routes.module.js';
import { RouteDirectionsModule } from './route-directions/route-directions.module.js';
import { RouteStopsModule } from './route-stops/route-stops.module.js';
import { FaresModule } from './fares/fares.module.js';
import { TripsModule } from './trips/trips.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { PaymentsModule } from './payments/payments.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
   ObserveModule.forRoot({
  appKey: process.env.OBSERVE_APP_KEY ?? '',
  appSecret: process.env.OBSERVE_APP_SECRET ?? '',
  serviceId: process.env.OBSERVE_SERVICE_ID ?? 'project-zero',
}),
    BusModule,
    AuthModule,
    StopsModule,
    RoutesModule,
    RouteDirectionsModule,
    RouteStopsModule,
    FaresModule,
    TripsModule,
    TicketsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
