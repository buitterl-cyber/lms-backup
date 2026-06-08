/**
 * Prisma client singleton. Reused across the API and jobs so we don't exhaust connections.
 * Tenant isolation is enforced by Postgres RLS + the app-layer tenant context; this client sets
 * the `app.tenant_id` GUC per request (see withTenant) so RLS policies can read it.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __riyadaPrisma: PrismaClient | undefined;
}

// Prisma 7 connects through a driver adapter rather than a schema-level `url`.
// PrismaPg manages its own pg pool from the connection string.
export const prisma: PrismaClient =
  global.__riyadaPrisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: process.env.NODE_ENV === "production" ? ["warn", "error"] : ["query", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.__riyadaPrisma = prisma;

/**
 * Run a callback with the Postgres session variable `app.tenant_id` set, so RLS policies scope
 * every query. Use inside a transaction for guaranteed session affinity.
 */
export async function withTenantRls<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId.replace(/'/g, "")}'`);
    return fn(tx as unknown as PrismaClient);
  });
}

export * from "@prisma/client";
