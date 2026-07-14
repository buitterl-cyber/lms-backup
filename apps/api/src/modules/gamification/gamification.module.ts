import { Global, Module } from "@nestjs/common";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";

// Global: enrollment, forums, auth, and authoring all emit XP/activity through this service.
@Global()
@Module({ controllers: [GamificationController], providers: [GamificationService], exports: [GamificationService] })
export class GamificationModule {}
