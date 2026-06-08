import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DemoService } from "./demo.service";

// Public (no tenant context) — TenantMiddleware skips /api/v1/demo/context. Demo-only bootstrap.
@ApiTags("demo")
@Controller("demo")
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Get("context")
  context() {
    return this.demo.context();
  }
}
