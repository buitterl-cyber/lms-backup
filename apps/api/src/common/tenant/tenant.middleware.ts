import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { runWithTenant, type TenantContext, type UserRoleKey } from "@riyada/shared";
import { AuthService } from "../../modules/auth/auth.service";

/**
 * Resolves tenant + identity for every request and runs the rest of the pipeline inside the
 * AsyncLocalStorage tenant context. The principal comes from a verified JWT (issued by
 * /auth/login); the host is also used to resolve white-label custom domains to a tenant.
 *
 * SECURITY (2026-07-21, two-part fix):
 *
 * 1) This middleware used to fall back to trusting client-supplied X-Tenant-Id / X-Org-Id /
 *    X-User-Id / X-Roles headers verbatim whenever there was no valid Bearer JWT, with no
 *    environment gate and no allowlist. Any anonymous caller could set those headers to an
 *    arbitrary tenant/org id plus "X-Roles: org_admin" and the API would grant full org-admin
 *    authority over that tenant — confirmed live against production (GET
 *    /api/v1/workforce/team returned 200 with no Authorization header at all, for a
 *    completely made-up tenant id).
 *
 * 2) The first fix (resolve the fixed public-demo tenant server-side instead of trusting
 *    headers) closed the cross-tenant impersonation vector, but surfaced a deeper problem:
 *    self-signup (auth.service.ts `signup()`) places every new learner in that same "default"
 *    tenant, and that tenant is what the anonymous fallback exposed with full org-admin
 *    visibility. Real signed-up users' names and emails were reachable by anyone, unauthenticated
 *    (confirmed live: GET /api/v1/workforce/team with no auth returned real learners, not just
 *    seed data). Per product decision, anonymous requests beyond the public marketing/catalog
 *    endpoints below now require a real login — there is no tenant-context fallback anymore.
 *    The already-public /sales/* marketing catalog (a separate code path, see PUBLIC_SEGMENTS)
 *    is unaffected and still works without login.
 */
/** Paths that must work without a tenant (probes, login, the pre-auth demo bootstrap). Checked
 *  by suffix so it's robust to the global prefix. */
const PUBLIC_SUFFIXES = [
  "/api/v1/health", "/api/v1/demo/context", "/api/v1/auth/login", "/api/v1/auth/signup",
  "/api/v1/auth/forgot", "/api/v1/auth/reset", "/api/v1/auth/me",
];
// Public site sections (marketing/sales). Auth is still honored when a Bearer token is present
// (the sales pipeline admin endpoints live under the same prefix), but absence of tenant
// context is not an error here.
const PUBLIC_SEGMENTS = ["/api/v1/sales/", "/api/v1/auth/social/"];

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const path = (req.originalUrl || req.url || "").split("?")[0];
    if (PUBLIC_SUFFIXES.some((s) => path.endsWith(s))) return next();
    if (PUBLIC_SEGMENTS.some((s) => path.includes(s))) {
      const authz = req.headers.authorization;
      if (authz?.startsWith("Bearer ")) {
        try {
          const c = AuthService.verify(authz.slice(7));
          const ctx: TenantContext = {
            tenantId: c.tenantId,
            organizationId: c.organizationId,
            userId: c.sub,
            roles: (c.roles ?? ["learner"]) as UserRoleKey[],
          };
          return runWithTenant(ctx, () => next());
        } catch {
          /* anonymous visitor */
        }
      }
      return next();
    }

    // Everything else requires a verified identity — a signed JWT from /auth/login. There is
    // deliberately no anonymous/demo fallback here (see security note above): tenant-scoped
    // data, including anything that could contain a real user's name or email, is never served
    // without a real session.
    const authz = req.headers.authorization;
    if (authz?.startsWith("Bearer ")) {
      try {
        const c = AuthService.verify(authz.slice(7));
        const ctx: TenantContext = {
          tenantId: c.tenantId,
          organizationId: c.organizationId,
          userId: c.sub,
          roles: (c.roles ?? ["learner"]) as UserRoleKey[],
        };
        return runWithTenant(ctx, () => next());
      } catch {
        throw new UnauthorizedException("Invalid or expired session");
      }
    }
    throw new UnauthorizedException("Authentication required");
  }
}
