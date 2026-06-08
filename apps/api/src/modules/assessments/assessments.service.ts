import { Injectable } from "@nestjs/common";
import { getTenantContext, NotFoundError } from "@riyada/shared";
import { gradeAttempt, type GradableQuestion } from "@riyada/intelligence";
import { PrismaService } from "../../common/prisma/prisma.service";

/**
 * Assessment attempts. Objective questions are graded instantly by the (tested) intelligence
 * grader; essay/practical are flagged for AI/rubric grading. A passing attempt linked to an
 * enrollment marks it complete.
 */
@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Assessment for the learner to take — questions WITHOUT answer keys (no cheating). */
  async getForTaking(id: string) {
    const { tenantId } = getTenantContext();
    const a = await this.prisma.db.assessment.findFirst({ where: { id, tenantId }, include: { questions: true } });
    if (!a) return null;
    return {
      id: a.id,
      title: a.title,
      passScore: a.passScore,
      questions: a.questions.map((q) => ({ id: q.id, type: q.type, prompt: q.prompt, options: (q.options as string[] | null) ?? [] })),
    };
  }

  async submit(assessmentId: string, input: { enrollmentId?: string; responses: Record<string, string[]> }) {
    const { tenantId } = getTenantContext();
    const assessment = await this.prisma.db.assessment.findFirst({
      where: { id: assessmentId, tenantId },
      include: { questions: true },
    });
    if (!assessment) throw new NotFoundError("Assessment", assessmentId);

    const questions: GradableQuestion[] = assessment.questions.map((q) => ({
      id: q.id,
      type: q.type as GradableQuestion["type"],
      answerKey: (q.answerKey as string[] | null) ?? undefined,
      points: q.points,
    }));

    const grade = gradeAttempt(questions, input.responses, assessment.passScore);

    const attempt = await this.prisma.db.assessmentAttempt.create({
      data: {
        tenantId,
        assessmentId,
        enrollmentId: input.enrollmentId,
        responses: input.responses,
        score: grade.percent ?? undefined,
        passed: grade.passed ?? undefined,
        gradedBy: grade.pendingManual.length ? "auto+pending" : "auto",
      },
    });

    return { attemptId: attempt.id, ...grade };
  }
}
