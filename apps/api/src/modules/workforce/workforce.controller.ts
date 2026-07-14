import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { WorkforceService } from "./workforce.service";
import { TeamService } from "./team.service";

@ApiTags("workforce")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("workforce")
export class WorkforceController {
  constructor(
    private readonly workforce: WorkforceService,
    private readonly team: TeamService,
  ) {}

  @Get("readiness")
  @RequirePermissions("skills:read")
  readiness(@Query("deptId") deptId: string, @Query("roleId") roleId: string) {
    return this.workforce.departmentReadiness(deptId, roleId);
  }

  @Get("team")
  @RequirePermissions("enrollment:read")
  teamDashboard() {
    return this.team.dashboard();
  }

  @Post("nudge")
  @RequirePermissions("enrollment:assign")
  nudge(@Body() body: { learnerId: string; courseId?: string; message?: string }) {
    return this.team.nudge(body);
  }
}
