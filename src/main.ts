import 'dotenv/config';
import { NestFactory } from '@nestjs/core'
import { AppModule, ObserveInstrument } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  })

  // Allow requests from React frontend
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()