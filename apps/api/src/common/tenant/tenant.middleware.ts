import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { runWithTenant, type TenantContext, type UserRoleKey } from "@riyada/shared";
import { AuthService } from "../../modules/auth/auth.service";

/**
 * Resolves tenant + identity for every request and runs the rest of the pipeline inside the
 * AsyncLocalStorage tenant context. In production the principal comes from a verified Keycloak
 * JWT; here we read a decoded-claims header set by the gateway/auth guard. The host is also used
 * to resolve white-label custom domains to a tenant.
 */
/** Paths that must work without a tenant (probes, login, the pre-auth demo bootstrap). Checked
 *  by suffix so it's robust to the global prefix. */
const PUBLIC_SUFFIXES = ["/api/v1/health", "/api/v1/demo/context", "/api/v1/auth/login", "/api/v1/auth/signup", "/api/v1/auth/me"];
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

    // 1. Verified identity: a signed JWT from /auth/login is the real path.
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
        /* invalid/expired token -> fall through to demo headers */
      }
    }

    // 2. Demo fallback: claims via headers (so the public demo works without login). Remove this
    //    branch to require real auth everywhere.
    const tenantId = (req.headers["x-tenant-id"] as string) || claimsFromAuth(req)?.tenantId;
    const organizationId =
      (req.headers["x-org-id"] as string) || claimsFromAuth(req)?.organizationId;

    if (!tenantId || !organizationId) {
      // Allow unauthenticated access to public/marketing + auth endpoints upstream of this.
      throw new UnauthorizedException("Missing tenant/organization context");
    }

    const ctx: TenantContext = {
      tenantId,
      organizationId,
      userId: (req.headers["x-user-id"] as string) || null,
      roles: parseRoles(req.headers["x-roles"] as string),
    };
    runWithTenant(ctx, () => next());
  }
}

function parseRoles(raw?: string): UserRoleKey[] {
  if (!raw) return ["guest"];
  return raw.split(",").map((r) => r.trim()) as UserRoleKey[];
}

function claimsFromAuth(req: Request): { tenantId?: string; organizationId?: string } | null {
  // Placeholder for JWT verification. The auth guard populates req.user in production.
  return (req as unknown as { user?: { tenantId?: string; organizationId?: string } }).user ?? null;
}
