import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '@/prisma/prisma.module';
import { HealthModule } from '@/health/health.module';
import configuration from '@/config/configuration';
import * as Joi from 'joi';

@Module({
  imports: [
    // Load and validate env variables at startup — if something's missing, the app refuses to boot
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        API_PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
      }),
    }),

    // Structured JSON logs — plays nicely with log aggregators like Datadog or CloudWatch
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),

    // Rate limiting — 100 requests per minute per IP by default, keeps scrapers away
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 100,
      },
    ]),

    // Core shared modules
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
