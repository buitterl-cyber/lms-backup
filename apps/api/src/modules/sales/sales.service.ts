import { Injectable, Logger } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import { prisma } from "@riyada/database";
import { PrismaService } from "../../common/prisma/prisma.service";
import { MailerService } from "../../common/mailer/mailer.service";

const MEILI_URL = process.env.MEILI_URL || "http://localhost:7700";
const MEILI_KEY = process.env.MEILI_KEY || "devmasterkey";
const INDEX = "courses";

/**
 * Public sales site backend (Carl's "sales website like other LMS providers"):
 * catalogue search (Meilisearch with a Postgres fallback), best-sellers + promotions,
 * and inquiries — each inquiry is a CRM deal seed and also emails sales immediately.
 *
 * PUBLIC: /sales/* runs without tenant context (see TenantMiddleware); queries here use the
 * default tenant explicitly and must only ever expose marketing-safe course fields.
 */
@Injectable()
export class SalesService {
  private readonly log = new Logger(SalesService.name);

  constructor(
    private readonly prismaSvc: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  /** The public site sells the platform tenant's catalogue (first tenant in this deployment). */
  private async defaultTenantId(): Promise<string | null> {
    const t = await prisma.tenant.findFirst({ select: { id: true } });
    return t?.id ?? null;
  }

  private async meili(path: string, init?: RequestInit, timeoutMs = 2500): Promise<Response | null> {
    try {
      const res = await fetch(`${MEILI_URL}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${MEILI_KEY}`, ...(init?.headers ?? {}) },
        signal: AbortSignal.timeout(timeoutMs),
      });
      return res;
    } catch {
      return null;
    }
  }

  private marketingShape(c: {
    id: string; title: string; description: string; providerKey: string; publisher: string | null;
    level: string | null; durationMinutes: number | null; bestSeller: boolean; priceCents: number | null;
  }) {
    return {
      id: c.id,
      title: c.title,
      description: c.description.length > 240 ? `${c.description.slice(0, 237)}…` : c.description,
      provider: c.publisher ?? c.providerKey,
      level: c.level,
      durationMinutes: c.durationMinutes,
      bestSeller: c.bestSeller,
      priceCents: c.priceCents,
    };
  }

  /** (Re)index the catalogue into Meilisearch. Safe to call anytime; admin-triggered. */
  async reindex() {
    const tenantId = await this.defaultTenantId();
    if (!tenantId) return { indexed: 0 };
    const courses = await prisma.course.findMany({ where: { tenantId } });
    const docs = courses.map((c) => ({
      id: c.id, title: c.title, description: c.description, provider: c.publisher ?? c.providerKey,
      level: c.level, durationMinutes: c.durationMinutes, bestSeller: c.bestSeller,
      priceCents: c.priceCents, categories: c.rawCategories,
    }));
    const res = await this.meili(`/indexes/${INDEX}/documents?primaryKey=id`, {
      method: "PUT", body: JSON.stringify(docs),
    }, 20_000); // full-catalogue payload — allow a real upload window
    if (!res?.ok) {
      this.log.warn(`meilisearch reindex unavailable (${res?.status ?? "offline"}) — search will use DB fallback`);
      return { indexed: 0, engine: "unavailable" };
    }
    return { indexed: docs.length, engine: "meilisearch" };
  }

  /** Instant search: Meilisearch when up, ILIKE fallback otherwise. */
  async search(q: string, limit = 24) {
    const tenantId = await this.defaultTenantId();
    if (!tenantId) return { items: [], engine: "none" };

    if (q.trim()) {
      const res = await this.meili(`/indexes/${INDEX}/search`, {
        method: "POST", body: JSON.stringify({ q, limit }),
      });
      if (res?.ok) {
        const data = (await res.json()) as { hits: Record<string, unknown>[] };
        if (data.hits.length) return { items: data.hits, engine: "meilisearch" };
      }
    }
    const courses = await prisma.course.findMany({
      where: {
        tenantId,
        ...(q.trim()
          ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }
          : {}),
      },
      orderBy: [{ bestSeller: "desc" }, { title: "asc" }],
      take: limit,
    });
    return { items: courses.map((c) => this.marketingShape(c)), engine: "db" };
  }

  /** Landing data: best-seller tiles + active promotions + catalogue size. */
  async featured() {
    const tenantId = await this.defaultTenantId();
    if (!tenantId) return { bestSellers: [], promotions: [], catalogSize: 0 };
    const [bestSellers, promotions, catalogSize] = await Promise.all([
      prisma.course.findMany({ where: { tenantId, bestSeller: true }, take: 6 }),
      prisma.promotion.findMany({
        where: { tenantId, active: true, OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
        orderBy: { createdAt: "desc" }, take: 4,
      }),
      prisma.course.count({ where: { tenantId } }),
    ]);
    return {
      bestSellers: bestSellers.map((c) => this.marketingShape(c)),
      promotions: promotions.map((p) => ({
        id: p.id, title: p.title, subtitle: p.subtitle, discountPct: p.discountPct, endsAt: p.endsAt,
      })),
      catalogSize,
    };
  }

  async courseDetail(id: string) {
    const tenantId = await this.defaultTenantId();
    const c = await prisma.course.findFirst({ where: { id, tenantId: tenantId ?? undefined } });
    if (!c) return null;
    const [modules, ratingAgg] = await Promise.all([
      prisma.courseModule.findMany({
        where: { courseId: id }, orderBy: { position: "asc" },
        select: { position: true, title: true, summary: true, durationMinutes: true },
      }),
      prisma.courseReview.aggregate({ where: { courseId: id }, _avg: { rating: true }, _count: { rating: true } }),
    ]);
    return {
      ...this.marketingShape(c),
      description: c.description, // full description on the detail page
      modules,
      rating: ratingAgg._count.rating ? Math.round((ratingAgg._avg.rating ?? 0) * 10) / 10 : null,
      ratingCount: ratingAgg._count.rating,
    };
  }

  /**
   * Inquiry = the CRM hook: persist the deal seed AND alert sales by email so contact
   * happens "ASAP" (Carl). Never fails the visitor on mail problems.
   */
  async inquire(input: { name: string; email: string; company?: string; phone?: string; message: string; courseId?: string }) {
    const tenantId = await this.defaultTenantId();
    const course = input.courseId
      ? await prisma.course.findFirst({ where: { id: input.courseId }, select: { title: true } })
      : null;
    const inquiry = await prisma.inquiry.create({
      data: {
        tenantId,
        name: input.name.slice(0, 200),
        email: input.email.slice(0, 200),
        company: input.company?.slice(0, 200),
        phone: input.phone?.slice(0, 50),
        message: input.message.slice(0, 4000),
        courseId: input.courseId,
      },
    });
    const salesTo = process.env.SALES_EMAIL || "bert@excis.com";
    await this.mailer.send(
      salesTo,
      `New LMS sales inquiry from ${input.name}${course ? ` — ${course.title}` : ""}`,
      `<p><strong>${input.name}</strong> (${input.email}${input.company ? `, ${input.company}` : ""}${input.phone ? `, ${input.phone}` : ""})</p>
       ${course ? `<p>Course: <strong>${course.title}</strong></p>` : ""}
       <p>${input.message.replace(/</g, "&lt;")}</p>
       <p><a href="${process.env.WEB_URL || "https://lms.excisone.com"}/sales-inquiries">Open the inquiry pipeline →</a></p>`,
    );
    return { received: true, id: inquiry.id };
  }

  // --- Admin pipeline (authenticated) ---

  async pipeline() {
    const { tenantId } = getTenantContext();
    const items = await this.prismaSvc.db.inquiry.findMany({
      where: { OR: [{ tenantId }, { tenantId: null }] },
      orderBy: { createdAt: "desc" }, take: 100,
    });
    const courses = await this.prismaSvc.db.course.findMany({
      where: { id: { in: items.map((i) => i.courseId).filter(Boolean) as string[] } },
      select: { id: true, title: true },
    });
    const titleOf = new Map(courses.map((c) => [c.id, c.title]));
    return items.map((i) => ({ ...i, courseTitle: i.courseId ? titleOf.get(i.courseId) ?? null : null }));
  }

  async setStatus(id: string, status: string) {
    return this.prismaSvc.db.inquiry.update({ where: { id }, data: { status } });
  }
}
