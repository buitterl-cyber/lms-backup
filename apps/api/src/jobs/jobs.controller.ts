import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/permissions.decorator";
import { JobsService } from "./jobs.service";

/** Admin/manual triggers for the scheduled jobs (the scheduler hits the same service in prod). */
@ApiTags("jobs")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post("expiry-sweep")
  @RequirePermissions("certification:manage")
  expirySweep() {
    return this.jobs.expirySweep();
  }

  @Post("compliance-recompute")
  @RequirePermissions("compliance:manage")
  complianceRecompute() {
    return this.jobs.complianceRiskRecompute();
  }

  @Post("catalog-sync")
  @RequirePermissions("provider:manage")
  catalogSync() {
    return this.jobs.enqueueCatalogSyncs();
  }

  @Post("nudge-sweep")
  @RequirePermissions("enrollment:assign")
  nudgeSweep() {
    return this.jobs.nudgeSweep();
  }
}
