/**
 * Prisma client singleton. Reused across the API and jobs so we don't exhaust connections.
 * Tenant isolation is enforced by Postgres RLS + the app-layer tenant context; this client sets
 * the `app.tenant_id` GUC per request (see withTenant) so RLS policies can read it.
 */
import { PrismaClient } from "@prisma/client";
declare global {
    var __riyadaPrisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient;
/**
 * Run a callback with the Postgres session variable `app.tenant_id` set, so RLS policies scope
 * every query. Use inside a transaction for guaranteed session affinity.
 */
export declare function withTenantRls<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T>;
export * from "@prisma/client";
