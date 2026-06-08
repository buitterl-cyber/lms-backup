import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsObject, IsOptional, IsString } from "class-validator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { AssessmentsService } from "./assessments.service";

class SubmitDto {
  @IsOptional() @IsString() enrollmentId?: string;
  @IsObject() responses!: Record<string, string[]>;
}

@ApiTags("assessments")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("assessments")
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Get(":id")
  @RequirePermissions("enrollment:read")
  get(@Param("id") id: string) {
    return this.assessments.getForTaking(id);
  }

  @Post(":id/attempts")
  @RequirePermissions("enrollment:read")
  submit(@Param("id") id: string, @Body() dto: SubmitDto) {
    return this.assessments.submit(id, dto);
  }
}
