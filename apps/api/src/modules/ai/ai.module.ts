import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { KnowledgeAcademyService } from "./knowledge-academy.service";
import { SkillsModule } from "../skills/skills.module";
import { ComplianceModule } from "../compliance/compliance.module";
import { RecommendationsModule } from "../recommendations/recommendations.module";

@Module({
  imports: [SkillsModule, ComplianceModule, RecommendationsModule],
  controllers: [AiController],
  providers: [AiService, KnowledgeAcademyService],
})
export class AiModule {}
