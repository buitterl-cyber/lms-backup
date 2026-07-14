import Link from "next/link";
import { Card, courseGlyph } from "@/components/ui";
import { apiGet, getContext, type CatalogResult } from "@/lib/api";

// Content Aggregation Hub — one catalog across every connected provider. Live data from
// /catalog/courses (seeded across GO1, MS Learn, AWS, Cybrary, O'Reilly).
export const dynamic = "force-dynamic";

const PROVIDER_LABEL: Record<string, string> = {
  go1: "GO1", "ms-learn": "Microsoft Learn", aws: "AWS Skill Builder", cybrary: "Cybrary",
  oreilly: "O'Reilly", "open-sesame": "OpenSesame", "ai-generated": "AI Generated",
};

async function load() {
  try {
    const ctx = await getContext();
    const data = await apiGet<CatalogResult>("/catalog/courses", ctx);
    return data.items;
  } catch {
    return [];
  }
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const all = await load();
  const needle = q.trim().toLowerCase();
  const courses = needle
    ? all.filter((c) => `${c.title} ${c.skills.join(" ")} ${c.provider}`.toLowerCase().includes(needle))
    : all;
  const providers = [...new Set(courses.map((c) => c.provider))];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Course Catalog</h1>
        <p className="text-sm text-muted">
          {q
            ? `${courses.length} course${courses.length === 1 ? "" : "s"} matching “${q}”`
            : `${courses.length} courses aggregated across ${providers.length} providers — one catalog, every source.`}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-brand/15 px-3 py-1 text-xs text-brand">All providers</span>
        {providers.map((p) => (
          <span key={p} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
            {PROVIDER_LABEL[p] ?? p}
          </span>
        ))}
      </div>

      {courses.length === 0 ? (
        <Card>No courses found. Connect a provider or run a catalog sync.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/catalog/${c.id}`} className="block">
              <Card className="flex h-full flex-col transition-colors hover:border-brand/50">
                {/* Icon in its own fixed box (shrink-0 + overflow-hidden) beside a min-w-0 text
                    column — the two can never overlap at any card width. */}
                <div className="flex items-start gap-3">
                  <span className="glyph flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-bg text-xl ring-1 ring-border">
                    {courseGlyph(`${c.title} ${c.skills.join(" ")}`)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <h3 className="font-medium leading-snug">{c.title}</h3>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="truncate text-xs uppercase tracking-wide text-muted">{PROVIDER_LABEL[c.provider] ?? c.provider}</span>
                      {c.level && <span className="shrink-0 rounded-full bg-border/60 px-2 py-0.5 text-[10px] uppercase text-muted">{c.level}</span>}
                    </span>
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.skills.slice(0, 4).map((s) => (
                    <span key={s} className="rounded-full bg-card px-2 py-0.5 text-[11px] text-muted ring-1 ring-border">{s}</span>
                  ))}
                </div>
                <div className="mt-3 flex-1 text-xs text-muted">
                  {c.durationMinutes ? `${Math.round(c.durationMinutes / 60)}h` : "Self-paced"}
                </div>
                <span className="mt-4 text-sm font-medium text-brand">View course →</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
