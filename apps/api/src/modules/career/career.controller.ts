import { Body, Controller, Post, Param, UseGuards } from "@nestjs/common";
import { IsString } from "class-validator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { CareerService } from "./career.service";

class CreatePlanDto {
  @IsString() targetRoleId!: string;
}

@ApiTags("career")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("users/:userId/career-plan")
export class CareerController {
  constructor(private readonly career: CareerService) {}

  @Post()
  @RequirePermissions("career:manage")
  create(@Param("userId") userId: string, @Body() dto: CreatePlanDto) {
    return this.career.createPlan(userId, dto.targetRoleId);
  }
}
