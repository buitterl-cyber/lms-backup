import { Module } from "@nestjs/common";
import { WorkforceController } from "./workforce.controller";
import { WorkforceService } from "./workforce.service";
import { TeamService } from "./team.service";

@Module({ controllers: [WorkforceController], providers: [WorkforceService, TeamService], exports: [TeamService] })
export class WorkforceModule {}
