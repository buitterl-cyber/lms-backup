import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { getTenantContext } from "@riyada/shared";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { InstructorService } from "./instructor.service";

@ApiTags("instructor")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller()
export class InstructorController {
  constructor(private readonly instructor: InstructorService) {}

  @Get("instructor/overview")
  @RequirePermissions("catalog:manage")
  overview() {
    return this.instructor.overview();
  }

  @Post("instructor/courses")
  @RequirePermissions("catalog:manage")
  createCourse(@Body() body: { title: string; description: string; level?: string; durationMinutes?: number }) {
    return this.instructor.createCourse(body);
  }

  @Post("instructor/courses/:id/modules")
  @RequirePermissions("catalog:manage")
  addModule(
    @Param("id") courseId: string,
    @Body() body: { title: string; summary?: string; durationMinutes?: number; content?: string; position?: number },
  ) {
    return this.instructor.addModule(courseId, body);
  }

  // Learner-facing: module list with unlock state + completion.
  @Get("courses/:id/modules")
  @RequirePermissions("catalog:read")
  modules(@Param("id") courseId: string, @Query("userId") userId?: string) {
    return this.instructor.modulesForLearner(courseId, userId || getTenantContext().userId || "");
  }

  @Post("modules/:id/complete")
  @RequirePermissions("enrollment:read")
  complete(@Param("id") moduleId: string) {
    return this.instructor.completeModule(moduleId);
  }
}
