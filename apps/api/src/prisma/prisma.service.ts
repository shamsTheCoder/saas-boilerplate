// This is the only place in the entire codebase where PrismaClient lives.
// Keeping it here means NestJS owns the connection pool — nothing else can accidentally spin up a second one.
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    
    // Create a native pg pool
    const pool = new Pool({ connectionString });
    
    // Wrap it in the Prisma Driver Adapter
    const adapter = new PrismaPg(pool);
    
    // Pass the adapter to the PrismaClient constructor
    super({
      adapter,
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

  // @nestjs/terminus PrismaHealthIndicator requires a plain PrismaClient reference.
  // Since PrismaService extends PrismaClient, we expose `this` cast to PrismaClient
  // so the health controller can pass it without a manual cast at every call site.
  get client(): PrismaClient {
    return this as unknown as PrismaClient;
  }
}
