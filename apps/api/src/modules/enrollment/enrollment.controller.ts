import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { EnrollmentService } from "./enrollment.service";

class EnrollDto {
  @IsString() userId!: string;
  @IsString() courseId!: string;
  @IsOptional() @IsString() assignedReason?: string;
}
class ProgressDto {
  @IsInt() @Min(0) @Max(100) percent!: number;
  @IsOptional() @IsInt() score?: number;
}

@ApiTags("enrollment")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller()
export class EnrollmentController {
  constructor(private readonly enrollment: EnrollmentService) {}

  // Learners may enroll THEMSELVES (that's what "Start course" is); enrolling someone
  // else still requires enrollment:assign — checked in the service.
  @Post("enrollments")
  @RequirePermissions("enrollment:read")
  enroll(@Body() dto: EnrollDto) {
    return this.enrollment.enroll(dto);
  }

  @Patch("enrollments/:id/progress")
  @RequirePermissions("enrollment:read")
  progress(@Param("id") id: string, @Body() dto: ProgressDto) {
    return this.enrollment.setProgress(id, dto.percent, dto.score);
  }

  @Get("users/:userId/enrollments")
  @RequirePermissions("enrollment:read")
  list(@Param("userId") userId: string) {
    return this.enrollment.listForUser(userId);
  }
}
