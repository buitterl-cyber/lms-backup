import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { CertificationService } from "./certification.service";

@ApiTags("certification")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("certifications")
export class CertificationController {
  constructor(private readonly certs: CertificationService) {}

  @Get("expiring")
  @RequirePermissions("certification:read")
  expiring(@Query("withinDays") withinDays?: string) {
    return this.certs.expiring(withinDays ? Number(withinDays) : 90);
  }

  @Get("user/:userId")
  @RequirePermissions("certification:read")
  forUser(@Param("userId") userId: string) {
    return this.certs.forUser(userId);
  }

  @Post("expiry-sweep")
  @RequirePermissions("certification:manage")
  sweep() {
    return this.certs.runExpirySweep();
  }
}
