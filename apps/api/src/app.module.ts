import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { PrismaModule } from "@/prisma/prisma.module";
import { HealthModule } from "@/health/health.module";
import { AuthModule } from "@/auth/auth.module";
import { OrganizationsModule } from "@/modules/organizations/organizations.module";
import { AuditModule } from "@/modules/audit/audit.module";
import { JwtAuthGuard } from "@/auth/jwt-auth.guard";
import configuration from "@/config/configuration";
import * as Joi from "joi";

@Module({
  imports: [
    // Load and validate env variables at startup — if something's missing, the app refuses to boot
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid("development", "production", "test")
          .default("development"),
        API_PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
        NEXT_PUBLIC_APP_URL: Joi.string()
          .uri()
          .default("http://localhost:3000"),
        // Stripe — optional locally, required in production
        STRIPE_SECRET_KEY: Joi.string().when("NODE_ENV", {
          is: "production",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        STRIPE_WEBHOOK_SECRET: Joi.string().when("NODE_ENV", {
          is: "production",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
      }),
    }),

    // Structured JSON logs — plays nicely with log aggregators like Datadog or CloudWatch
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== "production" ? "debug" : "info",
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { colorize: true } }
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
    AuthModule,

    // Feature modules
    AuditModule,
    OrganizationsModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally — each auth route overrides limits with @Throttle()
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Apply JwtAuthGuard globally — routes opt-out with @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
