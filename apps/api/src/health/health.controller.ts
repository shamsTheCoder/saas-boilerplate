import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisHealthIndicator } from './redis.health';

@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL }) // health check skips versioning — /health not /api/v1/health
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Ping the database — if this fails, the app is effectively down
      () => this.prismaHealth.pingCheck('database', this.prisma.client),

      // Make sure Redis is up — the job queue depends on it
      () => this.redisHealth.isHealthy('redis'),

      // Keep an eye on heap memory — 250MB should be plenty for a NestJS app
      () => this.memory.checkHeap('memory_heap', 250 * 1024 * 1024),
    ]);
  }
}
