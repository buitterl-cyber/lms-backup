import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { prisma } from "@riyada/database";

/**
 * Thin Nest wrapper around the shared Prisma singleton so modules can inject it. We reuse the
 * singleton (rather than `extends PrismaClient`) to avoid multiple connection pools.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly db = prisma;
  async onModuleInit() { await this.db.$connect(); }
  async onModuleDestroy() { await this.db.$disconnect(); }
}
