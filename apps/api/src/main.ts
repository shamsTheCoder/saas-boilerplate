import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { GlobalExceptionFilter } from '@/filters/global-exception.filter';
import { HttpAdapterHost } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // pino handles all logs — we silence the default NestJS logger here
    bufferLogs: true,
  });

  // Hook up the pino logger so structured JSON logs replace the default pretty logs
  app.useLogger(app.get(Logger));

  // Helmet adds a bunch of sensible security headers in one shot
  app.use(helmet());

  // Every public-facing route lives under /api/v1 — easy to version later
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Trust the frontend (Next.js) to call us — in prod, lock this down to the real domain
  app.enableCors({
    origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Validate every incoming DTO automatically — unknown fields get stripped too
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Catch all unhandled exceptions and log them properly
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter, app.get(Logger)));

  // Auto-generate Swagger docs at /api/docs — super helpful during development
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SaaS Boilerplate API')
    .setDescription('Internal API consumed exclusively by the Next.js BFF layer')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT ?? 3001;
  app.enableShutdownHooks();
  await app.listen(port);
}

bootstrap();
