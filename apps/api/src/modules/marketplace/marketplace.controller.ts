import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { IsArray } from "class-validator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { MarketplaceService } from "./marketplace.service";

class CheckoutDto {
  @IsArray() items!: { productId: string; quantity: number }[];
}

@ApiTags("marketplace")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("marketplace")
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  @Get("products")
  @RequirePermissions("marketplace:read")
  products(@Query("kind") kind?: string, @Query("q") q?: string) {
    return this.marketplace.listProducts(kind, q);
  }

  @Post("orders")
  @RequirePermissions("marketplace:buy")
  checkout(@Body() dto: CheckoutDto) {
    return this.marketplace.checkout(dto.items);
  }
}
