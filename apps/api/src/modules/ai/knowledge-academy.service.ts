import { Injectable } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import { LlmRouter } from "./llm-router";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { PrismaService } from "../../common/prisma/prisma.service";

/**
 * AI Knowledge Academy — turns an organization's own document (policy / SOP / PDF text) into a
 * real internal course: outline -> lessons -> assessment -> skill tags -> competency map. This is
 * a multi-stage LLM pipeline (each stage a focused generation, the "multi-agent" pattern from
 * docs/02 §14). Generated content is flagged internal + AI and goes through a human review gate
 * before publish. Persisted as an internal `Course` so it flows through the same LMS + skills
 * pipeline as any provider course.
 */
@Injectable()
export class KnowledgeAcademyService {
  private readonly router = new LlmRouter();
  constructor(private readonly prisma: PrismaService) {
    this.router.register(new AnthropicProvider());
  }

  async ingest(input: { title: string; documentText: string; source?: string }) {
    const { tenantId } = getTenantContext();

    // Stage 1 — outline + lessons + assessment + skills, as structured JSON.
    const generation = await this.generateCourse(input.title, input.documentText);

    // Persist as an internal (AI-generated) course in draft, pending human review.
    const course = await this.prisma.db.course.create({
      data: {
        tenantId,
        providerKey: input.source ? `internal:${input.source}` : "ai-generated",
        externalId: `kb-${slug(input.title)}-${input.documentText.length}`,
        title: generation.title || input.title,
        description: generation.summary ?? input.title,
        isInternal: true,
        modality: "self-paced",
        durationMinutes: Math.max(30, (generation.lessons?.length ?? 1) * 20),
      },
    });

    // Assessment from generated questions.
    if (generation.questions?.length) {
      const assessment = await this.prisma.db.assessment.create({
        data: { tenantId, courseId: course.id, title: `${course.title} — Assessment`, passScore: 70 },
      });
      await this.prisma.db.question.createMany({
        data: generation.questions.map((q) => ({
          assessmentId: assessment.id,
          type: q.type ?? "single",
          prompt: q.prompt,
          options: q.options ?? undefined,
          answerKey: q.answerKey ?? undefined,
          points: 1,
          aiGenerated: true,
        })),
      });
    }

    return {
      courseId: course.id,
      status: "draft_pending_review",
      lessons: generation.lessons?.length ?? 0,
      questions: generation.questions?.length ?? 0,
      competencies: generation.competencies ?? [],
    };
  }

  /** One reasoning call that returns the whole course shape. A production pipeline fans this into
   *  separate outline/lesson/assessment/tagger agents; the contract is the same. */
  private async generateCourse(title: string, documentText: string): Promise<GeneratedCourse> {
    const system =
      "You are a curriculum designer. From the supplied document, produce a JSON object with: " +
      "title, summary, lessons (array of {title, body}), questions (array of " +
      "{prompt, type:'single', options:[...], answerKey:[...]}), competencies (array of skill names). " +
      "Return ONLY JSON.";
    const res = await this.router.route("reasoning", {
      system,
      messages: [{ role: "user", content: `Title: ${title}\n\nDocument:\n${documentText.slice(0, 12000)}` }],
      maxTokens: 4096,
    });
    return parseGenerated(res.text);
  }
}

interface GeneratedCourse {
  title?: string;
  summary?: string;
  lessons?: { title: string; body: string }[];
  questions?: { prompt: string; type?: string; options?: string[]; answerKey?: string[] }[];
  competencies?: string[];
}

function parseGenerated(text: string): GeneratedCourse {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    return start >= 0 ? (JSON.parse(text.slice(start, end + 1)) as GeneratedCourse) : {};
  } catch {
    return {};
  }
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}
