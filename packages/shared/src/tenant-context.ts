/**
 * Tenant context propagated per-request via AsyncLocalStorage. Every DB query and event is
 * stamped from here, so no service forgets to scope by tenant. The Postgres RLS policies are
 * the defense-in-depth backstop (see database migrations).
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { UserRoleKey } from "./rbac";

export interface TenantContext {
  tenantId: string;
  organizationId: string;
  userId: string | null;
  roles: UserRoleKey[];
  /** subtree scope for dept/team-scoped role grants */
  scope?: { type: "organization" | "department" | "team"; id: string };
}

const als = new AsyncLocalStorage<TenantContext>();

export function runWithTenant<T>(ctx: TenantContext, fn: () => T): T {
  return als.run(ctx, fn);
}

export function getTenantContext(): TenantContext {
  const ctx = als.getStore();
  if (!ctx) throw new Error("No tenant context — request not wrapped by TenantMiddleware");
  return ctx;
}

export function maybeTenantContext(): TenantContext | undefined {
  return als.getStore();
}
