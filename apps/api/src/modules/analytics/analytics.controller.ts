import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { AnalyticsService } from "./analytics.service";

interface PageViewBody {
  path: string;
  referrer?: string;
}

function clientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0];
  return first?.trim() || req.ip || "unknown";
}

/** /analytics/pageview is PUBLIC (marketing site, fired client-side on every route change).
 *  /analytics/summary is the admin-only dashboard read. */
@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post("pageview")
  pageview(@Body() body: PageViewBody, @Req() req: Request) {
    if (!body?.path || typeof body.path !== "string") {
      throw new BadRequestException("path is required");
    }
    return this.analytics.record({
      path: body.path,
      referrer: body.referrer,
      ip: clientIp(req),
      userAgent: req.headers["user-agent"] ?? "unknown",
    });
  }

  @Get("summary")
  @UseGuards(PermissionsGuard)
  @RequirePermissions("audit:read")
  summary(@Query("days") days?: string) {
    return this.analytics.summary(days ? Math.min(90, Number(days)) : 14);
  }
}
