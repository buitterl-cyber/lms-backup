import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { CatalogService } from "./catalog.service";

@ApiTags("catalog")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("courses")
  @RequirePermissions("catalog:read")
  search(
    @Query("q") q?: string,
    @Query("skill") skillId?: string,
    @Query("provider") provider?: string,
    @Query("cursor") cursor?: string,
  ) {
    return this.catalog.search({ q, skillId, provider, cursor });
  }

  @Get("courses/:id")
  @RequirePermissions("catalog:read")
  getCourse(@Param("id") id: string) {
    return this.catalog.getCourse(id);
  }
}
