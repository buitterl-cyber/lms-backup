import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { prisma } from "@riyada/database";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { recordError } from "../../common/errors/error-log";

interface ReportBody {
  message: string;
  stack?: string;
  path?: string;
  meta?: Record<string, unknown>;
}

/** /errors/report is PUBLIC — a broken page for a logged-out or session-expired visitor is
 *  exactly the kind of thing we want to hear about, so it can't require auth. /errors (the list)
 *  is admin-only; reuses "audit:read" rather than adding a new permission for one small page. */
@ApiTags("errors")
@Controller("errors")
export class ErrorsController {
  @Post("report")
  async report(@Body() body: ReportBody) {
    if (!body?.message || typeof body.message !== "string") {
      throw new BadRequestException("message is required");
    }
    await recordError({
      source: "web",
      message: body.message.slice(0, 2000),
      stack: typeof body.stack === "string" ? body.stack.slice(0, 8000) : undefined,
      path: typeof body.path === "string" ? body.path.slice(0, 500) : undefined,
      statusCode: 500,
      meta: body.meta,
    });
    return { received: true };
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions("audit:read")
  async list(@Query("limit") limit?: string) {
    return prisma.errorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit ? Math.min(200, Number(limit)) : 50,
    });
  }
}
