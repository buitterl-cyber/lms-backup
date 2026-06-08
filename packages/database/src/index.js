"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.withTenantRls = withTenantRls;
/**
 * Prisma client singleton. Reused across the API and jobs so we don't exhaust connections.
 * Tenant isolation is enforced by Postgres RLS + the app-layer tenant context; this client sets
 * the `app.tenant_id` GUC per request (see withTenant) so RLS policies can read it.
 */
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
// Prisma 7 connects through a driver adapter rather than a schema-level `url`.
// PrismaPg manages its own pg pool from the connection string.
exports.prisma = global.__riyadaPrisma ??
    new client_1.PrismaClient({
        adapter: new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL }),
        log: process.env.NODE_ENV === "production" ? ["warn", "error"] : ["query", "warn", "error"],
    });
if (process.env.NODE_ENV !== "production")
    global.__riyadaPrisma = exports.prisma;
/**
 * Run a callback with the Postgres session variable `app.tenant_id` set, so RLS policies scope
 * every query. Use inside a transaction for guaranteed session affinity.
 */
async function withTenantRls(tenantId, fn) {
    return exports.prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId.replace(/'/g, "")}'`);
        return fn(tx);
    });
}
__exportStar(require("@prisma/client"), exports);
