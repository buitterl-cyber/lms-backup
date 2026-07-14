import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { SalesService } from "./sales.service";

/** /sales/* is PUBLIC (marketing site) — TenantMiddleware lets it through without tenant
 *  context. Only marketing-safe shapes leave this controller. The pipeline endpoints below
 *  are authenticated admin surface. */
@ApiTags("sales")
@Controller("sales")
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get("featured")
  featured() {
    return this.sales.featured();
  }

  @Get("catalog")
  search(@Query("q") q?: string, @Query("limit") limit?: string) {
    return this.sales.search(q ?? "", limit ? Math.min(60, Number(limit)) : 24);
  }

  @Get("courses/:id")
  async course(@Param("id") id: string) {
    const c = await this.sales.courseDetail(id);
    if (!c) throw new BadRequestException("Unknown course");
    return c;
  }

  @Post("inquiries")
  inquire(@Body() body: { name: string; email: string; company?: string; phone?: string; message: string; courseId?: string }) {
    if (!body?.name || !/.+@.+\..+/.test(body?.email ?? "") || !body?.message) {
      throw new BadRequestException("name, valid email and message are required");
    }
    return this.sales.inquire(body);
  }

  // --- Authenticated admin pipeline ---

  @Get("pipeline")
  @UseGuards(PermissionsGuard)
  @RequirePermissions("enrollment:assign")
  pipeline() {
    return this.sales.pipeline();
  }

  @Patch("pipeline/:id")
  @UseGuards(PermissionsGuard)
  @RequirePermissions("enrollment:assign")
  setStatus(@Param("id") id: string, @Body() body: { status: string }) {
    return this.sales.setStatus(id, body.status);
  }

  @Post("reindex")
  @UseGuards(PermissionsGuard)
  @RequirePermissions("catalog:manage")
  reindex() {
    return this.sales.reindex();
  }
}
