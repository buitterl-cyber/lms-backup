import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { IdentityService } from "./identity.service";
import type { UserRoleKey } from "@riyada/shared";

class InviteDto {
  @IsString() email!: string;
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() role?: UserRoleKey;
}
class AssignRoleDto {
  @IsString() userId!: string;
  @IsString() role!: UserRoleKey;
}

@ApiTags("identity")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller()
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Get("users")
  @RequirePermissions("user:manage")
  list() {
    return this.identity.listUsers();
  }

  @Post("users")
  @RequirePermissions("user:manage")
  invite(@Body() dto: InviteDto) {
    return this.identity.inviteUser(dto);
  }

  @Post("users/roles")
  @RequirePermissions("role:manage")
  assignRole(@Body() dto: AssignRoleDto) {
    return this.identity.assignRole(dto.userId, dto.role);
  }
}
