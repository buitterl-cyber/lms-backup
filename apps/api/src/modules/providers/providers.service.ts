import { Injectable } from "@nestjs/common";
import { getTenantContext, NotFoundError } from "@riyada/shared";
import { createProvider, listRegisteredProviders } from "@riyada/providers";
import { PrismaService } from "../../common/prisma/prisma.service";
import { decryptProviderCredentials, encryptProviderCredentials } from "./provider-credentials";

/**
 * Provider connection management + catalog sync orchestration. Wraps the Provider Abstraction
 * Layer (@riyada/providers): the service speaks the universal CourseProvider interface, never a
 * vendor SDK. In production, `sync` emits a `catalog.sync.requested` event and a worker runs the
 * sync; here we run it inline so the flow is demonstrable end to end.
 */
@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  listAvailable() {
    return listRegisteredProviders();
  }

  /** Tenant's provider connections with their synced-course counts (for the admin console). */
  async listConnections() {
    const { tenantId, organizationId } = getTenantContext();
    const conns = await this.prisma.db.providerConnection.findMany({
      where: { tenantId, organizationId },
      orderBy: { providerKey: "asc" },
    });
    const out = [];
    for (const c of conns) {
      const courses = await this.prisma.db.course.count({ where: { tenantId, providerKey: c.providerKey } });
      out.push({ id: c.id, providerKey: c.providerKey, displayName: c.displayName, status: c.status, lastSyncedAt: c.lastSyncedAt, courses });
    }
    return out;
  }

  async connect(input: { providerKey: string; displayName: string; credentials: Record<string, string> }) {
    const { tenantId, organizationId } = getTenantContext();
    return this.prisma.db.providerConnection.upsert({
      where: { organizationId_providerKey: { organizationId, providerKey: input.providerKey } },
      update: { displayName: input.displayName, credentialsEnc: encryptProviderCredentials(input.credentials) },
      create: {
        tenantId,
        organizationId,
        providerKey: input.providerKey,
        displayName: input.displayName,
        credentialsEnc: encryptProviderCredentials(input.credentials),
      },
      select: { id: true, providerKey: true, status: true },
    });
  }

  /**
   * Catalog sync through the PAL: page the provider's normalized courses and upsert Course +
   * Skill + CourseSkill rows, reconciling provider skill tags into the Skills Graph (creating
   * canonical skills on first sight). In production this runs as a background job off
   * `catalog.sync.requested`; here it runs inline so the result is immediate.
   */
  async sync(connectionId: string, limit = 120) {
    const { tenantId, organizationId } = getTenantContext();
    const conn = await this.prisma.db.providerConnection.findFirst({ where: { id: connectionId, tenantId } });
    if (!conn) throw new NotFoundError("ProviderConnection", connectionId);

    const provider = createProvider(conn.providerKey, {
      tenantId,
      organizationId,
      credentials: decryptProviderCredentials(conn.credentialsEnc),
    });

    const page = await provider.listCourses({ limit });

    // In-memory skill cache to avoid re-querying; seeded with existing skills.
    const cache = new Map<string, string>();
    for (const s of await this.prisma.db.skill.findMany({ where: { OR: [{ tenantId }, { tenantId: null }] }, select: { id: true, name: true } })) {
      cache.set(s.name.toLowerCase(), s.id);
    }

    let coursesUpserted = 0;
    let skillsCreated = 0;
    let linksUpserted = 0;

    for (const c of page.items) {
      const course = await this.prisma.db.course.upsert({
        where: { providerKey_externalId_tenantId: { providerKey: c.providerKey, externalId: c.externalId, tenantId } },
        update: { title: c.title, description: c.description, durationMinutes: c.durationMinutes ?? null, level: c.level ?? null, modality: c.modality, launchUrl: c.launchUrl ?? null, imageUrl: c.imageUrl ?? null },
        create: {
          tenantId, providerKey: c.providerKey, externalId: c.externalId, title: c.title,
          description: c.description, durationMinutes: c.durationMinutes ?? null, level: c.level ?? null,
          modality: c.modality, publisher: c.publisher, rawCategories: c.rawCategories, connectionId: conn.id,
          launchUrl: c.launchUrl ?? null, imageUrl: c.imageUrl ?? null,
        },
      });
      coursesUpserted++;

      const seen = new Set<string>();
      for (const tag of c.skills.slice(0, 6)) {
        const key = tag.raw.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        let skillId = cache.get(key);
        if (!skillId) {
          const s = await this.prisma.db.skill.create({ data: { tenantId, name: tag.raw } });
          skillId = s.id;
          cache.set(key, skillId);
          skillsCreated++;
        }
        await this.prisma.db.courseSkill.upsert({
          where: { courseId_skillId: { courseId: course.id, skillId } },
          update: {},
          create: { courseId: course.id, skillId, confidence: tag.confidence },
        });
        linksUpserted++;
      }
    }

    await this.prisma.db.providerConnection.update({ where: { id: conn.id }, data: { lastSyncedAt: new Date() } });
    return { providerKey: conn.providerKey, coursesUpserted, skillsCreated, skillLinks: linksUpserted };
  }
}
