import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Prisma 7 config: connection URLs are configured here (not in schema.prisma).
  // We use DIRECT_URL for CLI operations (migrate/db push) to avoid pooler/pgbouncer issues.
  datasource: {
    // CI can run `pnpm install` without DB secrets; avoid hard-failing config loading.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  },
});

