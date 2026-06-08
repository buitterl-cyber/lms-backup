import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsObject, IsString } from "class-validator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { ProvidersService } from "./providers.service";

class ConnectDto {
  @IsString() providerKey!: string;
  @IsString() displayName!: string;
  @IsObject() credentials!: Record<string, string>;
}

@ApiTags("providers")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("providers")
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get("available")
  @RequirePermissions("provider:manage")
  available() {
    return this.providers.listAvailable();
  }

  @Get("connections")
  @RequirePermissions("provider:manage")
  connections() {
    return this.providers.listConnections();
  }

  @Post("connections")
  @RequirePermissions("provider:manage")
  connect(@Body() dto: ConnectDto) {
    return this.providers.connect(dto);
  }

  @Post("connections/:id/sync")
  @RequirePermissions("provider:manage")
  sync(@Param("id") id: string) {
    return this.providers.sync(id);
  }
}
