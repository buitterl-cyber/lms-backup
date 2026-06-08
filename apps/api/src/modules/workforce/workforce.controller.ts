import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { WorkforceService } from "./workforce.service";

@ApiTags("workforce")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("workforce")
export class WorkforceController {
  constructor(private readonly workforce: WorkforceService) {}

  @Get("readiness")
  @RequirePermissions("skills:read")
  readiness(@Query("deptId") deptId: string, @Query("roleId") roleId: string) {
    return this.workforce.departmentReadiness(deptId, roleId);
  }
}
