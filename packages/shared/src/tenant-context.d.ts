/**
 * Tenant context propagated per-request via AsyncLocalStorage. Every DB query and event is
 * stamped from here, so no service forgets to scope by tenant. The Postgres RLS policies are
 * the defense-in-depth backstop (see database migrations).
 */
import type { UserRoleKey } from "./rbac";
export interface TenantContext {
    tenantId: string;
    organizationId: string;
    userId: string | null;
    roles: UserRoleKey[];
    /** subtree scope for dept/team-scoped role grants */
    scope?: {
        type: "organization" | "department" | "team";
        id: string;
    };
}
export declare function runWithTenant<T>(ctx: TenantContext, fn: () => T): T;
export declare function getTenantContext(): TenantContext;
export declare function maybeTenantContext(): TenantContext | undefined;
