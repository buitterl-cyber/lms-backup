import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { SkillsService } from "./skills.service";

@ApiTags("skills")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("users/:userId")
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get("skills")
  @RequirePermissions("skills:read")
  getUserSkills(@Param("userId") userId: string) {
    return this.skills.getUserSkills(userId);
  }

  @Get("skill-gap")
  @RequirePermissions("skills:read")
  getSkillGap(@Param("userId") userId: string, @Query("roleId") roleId: string) {
    return this.skills.getSkillGap(userId, roleId);
  }
}
