import { Controller, Get, Param, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { ReportingService, type ReportKind } from "./reporting.service";

@ApiTags("reporting")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("reports")
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @Get(":kind")
  @RequirePermissions("report:export")
  async report(
    @Param("kind") kind: ReportKind,
    @Query("format") format: "json" | "csv" = "json",
    @Res() res: Response,
  ) {
    const rows = await this.reporting.rows(kind);
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${kind}.csv"`);
      return res.send(this.reporting.toCsv(rows));
    }
    return res.json({ kind, count: rows.length, rows });
  }
}
