import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { RecommendationsService } from "./recommendations.service";

@ApiTags("recommendations")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller()
export class RecommendationsController {
  constructor(private readonly recs: RecommendationsService) {}

  @Get("users/:userId/recommendations")
  @RequirePermissions("recommendation:read")
  list(@Param("userId") userId: string) {
    return this.recs.listForUser(userId);
  }

  @Post("users/:userId/recommendations/generate")
  @RequirePermissions("recommendation:read")
  generate(@Param("userId") userId: string, @Query("roleId") roleId?: string) {
    return this.recs.generateForUser(userId, roleId);
  }

  @Post("recommendations/:id/accept")
  @RequirePermissions("enrollment:assign")
  accept(@Param("id") id: string) {
    return this.recs.accept(id);
  }
}
