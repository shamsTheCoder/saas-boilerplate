// This is the only place in the entire codebase where PrismaClient lives.
// Keeping it here means NestJS owns the connection pool — nothing else can accidentally spin up a second one.
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    // Connect as soon as the module loads so the first request doesn't pay the connection cost
    await this.$connect();
  }

  async onModuleDestroy() {
    // Clean up gracefully when the app shuts down — no dangling connections
    await this.$disconnect();
  }
}
