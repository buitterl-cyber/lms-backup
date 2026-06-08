import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

// Liveness/readiness for k8s probes. Public (no tenant context needed) — but note the global
// TenantMiddleware applies to all routes; health is excluded in app.module's middleware config.
@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { status: "ok", service: "riyada-api", ts: new Date().toISOString() };
  }
}
