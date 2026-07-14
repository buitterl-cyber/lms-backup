import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { getTenantContext } from "@riyada/shared";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { GamificationService } from "./gamification.service";

@ApiTags("gamification")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("gamification")
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  @Get("me")
  @RequirePermissions("enrollment:read")
  me(@Query("userId") userId?: string) {
    return this.gamification.profile(userId || getTenantContext().userId || "");
  }

  @Get("leaderboard")
  @RequirePermissions("enrollment:read")
  leaderboard(@Query("days") days?: string) {
    return this.gamification.leaderboard(days ? Number(days) : 30);
  }
}
