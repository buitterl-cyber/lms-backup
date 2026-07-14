import { Global, Module } from "@nestjs/common";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { EventBus } from "../common/events/event-bus";
import { WorkforceModule } from "../modules/workforce/workforce.module";

@Global()
@Module({ imports: [WorkforceModule], controllers: [JobsController], providers: [JobsService, EventBus], exports: [EventBus] })
export class JobsModule {}
