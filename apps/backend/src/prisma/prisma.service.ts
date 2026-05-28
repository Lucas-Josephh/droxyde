import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Prisma 7 requires either a driver adapter (direct connection) or accelerateUrl.
    // We use a pg Pool adapter and prefer DIRECT_URL to avoid pooler/pgbouncer issues.
    // Important: with the pg driver adapter, `schema=` in the querystring is NOT a reliable
    // way to set the PostgreSQL `search_path`. We enforce it via connection options.
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
    if (!connectionString) {
      // Let Prisma throw a clear error later; keep constructor sync.
      super();
      return;
    }

    const pool = new Pool({
      connectionString,
      options: '-c search_path=droxyde',
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL via Prisma');
    } catch (err) {
      this.logger.error('Failed to connect to PostgreSQL', err as Error);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
