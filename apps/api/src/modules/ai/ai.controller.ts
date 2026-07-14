import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { AiService } from "./ai.service";
import { KnowledgeAcademyService } from "./knowledge-academy.service";

class ChatDto {
  @IsString() prompt!: string;
  @IsOptional() @IsString() courseId?: string;
}

class IngestDto {
  @IsString() title!: string;
  @IsString() documentText!: string;
  @IsOptional() @IsString() source?: string;
}

@ApiTags("ai")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller("ai")
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly academy: KnowledgeAcademyService,
  ) {}

  @Post("chat")
  @RequirePermissions("ai:use")
  chat(@Body() dto: ChatDto) {
    return this.ai.chat(dto.prompt, {}, dto.courseId);
  }

  @Post("knowledge-academy/ingest")
  @RequirePermissions("catalog:manage")
  ingest(@Body() dto: IngestDto) {
    return this.academy.ingest(dto);
  }
}
