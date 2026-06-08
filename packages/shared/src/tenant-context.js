"use strict";
/**
 * Tenant context propagated per-request via AsyncLocalStorage. Every DB query and event is
 * stamped from here, so no service forgets to scope by tenant. The Postgres RLS policies are
 * the defense-in-depth backstop (see database migrations).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithTenant = runWithTenant;
exports.getTenantContext = getTenantContext;
exports.maybeTenantContext = maybeTenantContext;
const node_async_hooks_1 = require("node:async_hooks");
const als = new node_async_hooks_1.AsyncLocalStorage();
function runWithTenant(ctx, fn) {
    return als.run(ctx, fn);
}
function getTenantContext() {
    const ctx = als.getStore();
    if (!ctx)
        throw new Error("No tenant context — request not wrapped by TenantMiddleware");
    return ctx;
}
function maybeTenantContext() {
    return als.getStore();
}
