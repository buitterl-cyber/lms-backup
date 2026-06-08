import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { ComplianceService } from "./compliance.service";

@ApiTags("compliance")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("compliance")
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get("dashboard")
  @RequirePermissions("compliance:read")
  dashboard(@Query("deptId") deptId: string) {
    return this.compliance.departmentDashboard(deptId);
  }
}
