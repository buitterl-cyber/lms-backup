import { Global, Module } from "@nestjs/common";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { EventBus } from "../common/events/event-bus";

@Global()
@Module({ controllers: [JobsController], providers: [JobsService, EventBus], exports: [EventBus] })
export class JobsModule {}
