import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { maybeTenantContext } from "@riyada/shared";
import { prisma } from "@riyada/database";

/**
 * Writes an append-only AuditLog row for state-changing requests. The AuditLog table is
 * INSERT-only at the DB level (trigger in the migration), so this can never tamper with history.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    return next.handle().pipe(
      tap(() => {
        if (!mutating) return;
        const ctx = maybeTenantContext();
        if (!ctx) return;
        void prisma.auditLog.create({
          data: {
            tenantId: ctx.tenantId,
            actorId: ctx.userId ?? undefined,
            action: `${req.method} ${req.route?.path ?? req.url}`,
            entity: (req.baseUrl ?? "").split("/").pop() || "request",
            metadata: { params: req.params, query: req.query },
            ip: req.ip,
          },
        }).catch(() => undefined); // never block the response on audit
      }),
    );
  }
}
