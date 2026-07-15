import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// A custom health indicator since @nestjs/terminus doesn't ship a Redis one out of the box
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private client: Redis;

  constructor(private readonly config: ConfigService) {
    super();
    // We create a one-off client just for health checks — keeps it separate from the job queue client
    this.client = new Redis(this.config.get<string>('redis.url')!, {
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.client.ping();
      return this.getStatus(key, true);
    } catch {
      throw new HealthCheckError('Redis check failed', this.getStatus(key, false));
    }
  }
}
