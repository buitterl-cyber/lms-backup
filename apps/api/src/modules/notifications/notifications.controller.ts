import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get("users/:userId/notifications")
  @RequirePermissions("ai:use")
  list(@Param("userId") userId: string) {
    return this.notifications.listForUser(userId);
  }

  @Post("notifications/:id/read")
  @RequirePermissions("ai:use")
  read(@Param("id") id: string) {
    return this.notifications.markRead(id);
  }

  @Post("certifications/renewal-campaign")
  @RequirePermissions("certification:manage")
  renewalCampaign(@Query("withinDays") withinDays?: string) {
    return this.notifications.renewalCampaign(withinDays ? Number(withinDays) : 90);
  }
}
