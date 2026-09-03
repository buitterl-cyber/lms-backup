import { Module } from "@nestjs/common";
import { ProvidersController } from "./providers.controller";
import { ProviderWebhooksController } from "./provider-webhooks.controller";
import { ProvidersService } from "./providers.service";

@Module({ controllers: [ProvidersController, ProviderWebhooksController], providers: [ProvidersService] })
export class ProvidersModule {}
