import { Injectable } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import { PrismaService } from "../../common/prisma/prisma.service";

/**
 * Catalog search. In production this reads from a Meilisearch index kept in sync by the
 * `catalog.course.upserted` event consumer; here it queries Postgres directly so the endpoint
 * works without the search cluster. Same response shape either way.
 */
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async search(opts: { q?: string; skillId?: string; provider?: string; cursor?: string }) {
    const { tenantId } = getTenantContext();
    const courses = await this.prisma.db.course.findMany({
      where: {
        tenantId,
        ...(opts.provider ? { providerKey: opts.provider } : {}),
        ...(opts.q ? { title: { contains: opts.q, mode: "insensitive" } } : {}),
        ...(opts.skillId ? { skills: { some: { skillId: opts.skillId } } } : {}),
      },
      include: { skills: { include: { skill: true } } },
      take: 50,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      orderBy: { title: "asc" },
    });
    return {
      items: courses.map((c) => ({
        id: c.id,
        title: c.title,
        provider: c.providerKey,
        level: c.level,
        durationMinutes: c.durationMinutes,
        skills: c.skills.map((s) => s.skill.name),
      })),
      nextCursor: courses.length === 50 ? courses[courses.length - 1].id : undefined,
    };
  }

  async getCourse(id: string) {
    const { tenantId } = getTenantContext();
    const c = await this.prisma.db.course.findFirst({
      where: { id, tenantId },
      include: { skills: { include: { skill: true } } },
    });
    if (!c) return null;
    const assessment = await this.prisma.db.assessment.findFirst({ where: { tenantId, courseId: c.id }, select: { id: true } });
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      provider: c.providerKey,
      level: c.level,
      durationMinutes: c.durationMinutes,
      publisher: c.publisher,
      launchUrl: c.launchUrl,
      imageUrl: c.imageUrl,
      skills: c.skills.map((s) => s.skill.name),
      assessmentId: assessment?.id ?? null,
    };
  }
}
