import type { Metadata } from "next";
import Link from "next/link";
import { InquiryForm } from "@/components/InquiryForm";
import { PublicChrome } from "@/components/PublicChrome";
import { Button, Card } from "@/components/ui";

// PUBLIC sales catalogue — chrome matches the marketing homepage language.
export const dynamic = "force-dynamic";

// Canonical stays the clean, query-free /courses regardless of ?q= search terms — search-result
// variations shouldn't be indexed as separate pages (duplicate-content risk).
export const metadata: Metadata = {
  title: "Course Catalog — Riyada Intelligence",
  description: "Browse training courses across Riyada Intelligence's connected learning providers.",
  alternates: { canonical: "/courses" },
};

const API = (process.env.API_INTERNAL_URL || process.env.API_URL || "http://localhost:4400") + "/api/v1";

interface SalesCourse {
  id: string; title: string; description: string; provider: string; level?: string | null;
  durationMinutes?: number | null; bestSeller: boolean; priceCents?: number | null;
}
interface Featured {
  bestSellers: SalesCourse[];
  promotions: { id: string; title: string; subtitle?: string | null; discountPct?: number | null }[];
  catalogSize: number;
}

function price(cents?: number | null) {
  return cents ? `$${(cents / 100).toFixed(0)}` : "Included";
}

/** Hide description when it's empty or just repeats the title (common in seed data). */
function courseBlurb(title: string, description?: string | null) {
  const d = (description || "").trim();
  if (!d) return null;
  if (d.toLowerCase() === title.trim().toLowerCase()) return null;
  return d;
}

async function load(q: string) {
  const [featured, results] = await Promise.all([
    fetch(`${API}/sales/featured`, { cache: "no-store" }).then((r) => r.json() as Promise<Featured>).catch(() => null),
    fetch(`${API}/sales/catalog?q=${encodeURIComponent(q)}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<{ items: SalesCourse[] }>)
      .then((r) => r.items)
      .catch(() => [] as SalesCourse[]),
  ]);
  return { featured, results };
}

export default async function PublicCatalog({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { featured, results } = await load(q);

  return (
    <div className="mkt-page min-h-screen">
      <PublicChrome active="courses" />

      <main className="mx-auto max-w-[1280px] space-y-7 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-md border border-border/80 bg-card/80 px-4 py-7 text-center shadow-[0_20px_50px_-30px_rgba(15,23,42,0.3)] sm:px-10 sm:py-12">
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand sm:text-[11px] sm:tracking-[0.18em]">
              Content catalogue
            </p>
            <h1 className="font-display mt-2 text-[1.55rem] font-semibold leading-snug tracking-tight sm:mt-3 sm:text-4xl">
              Find training that closes the gaps you already see
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted sm:mt-3 sm:text-base">
              Search {featured?.catalogSize?.toLocaleString() ?? "the"} courses across connected providers — secondary to readiness, useful when you act.
            </p>
            <form action="/courses" className="mx-auto mt-5 flex max-w-xl flex-col gap-2 sm:flex-row">
              <input
                name="q"
                defaultValue={q}
                placeholder="Try ITIL, security, cloud…"
                className="min-h-12 min-w-0 w-full flex-1 rounded-xl border border-border bg-bg/70 px-3.5 text-base outline-none focus:border-brand sm:px-4 sm:text-sm"
              />
              <Button type="submit" size="lg" className="min-h-12 w-full shrink-0 rounded-xl px-5 sm:w-auto sm:rounded-full sm:px-7">
                Search
              </Button>
            </form>
          </div>
        </section>

        {featured && featured.promotions.length > 0 && (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featured.promotions.map((p) => (
              <Card key={p.id} tone="amber" padding="md" radius="lg" interactive>
                <p className="text-sm font-semibold">{p.title}{p.discountPct ? ` — ${p.discountPct}% off` : ""}</p>
                {p.subtitle && <p className="mt-1 text-xs text-muted">{p.subtitle}</p>}
              </Card>
            ))}
          </section>
        )}

        {!q && featured && featured.bestSellers.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-semibold">Best sellers</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.bestSellers.map((c) => {
                const blurb = courseBlurb(c.title, c.description);
                return (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="group rounded-md border border-border bg-card p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber">
                      Best seller
                    </span>
                    <span className="text-sm font-semibold">{price(c.priceCents)}</span>
                  </div>
                  <p className="mt-3 font-medium group-hover:text-brand">{c.title}</p>
                  {blurb && <p className="mt-1 line-clamp-2 text-xs text-muted">{blurb}</p>}
                  <p className="mt-3 text-xs uppercase tracking-wide text-muted">
                    {c.provider}{c.level ? ` · ${c.level}` : ""}
                  </p>
                </Link>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display text-lg font-semibold">{q ? `Results for “${q}”` : "Browse the catalogue"}</h2>
          {results.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No courses matched — try a broader search.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((c) => {
                const blurb = courseBlurb(c.title, c.description);
                return (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="group rounded-md border border-border bg-card p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg"
                >
                  <p className="font-medium group-hover:text-brand">{c.title}</p>
                  {blurb && <p className="mt-1 line-clamp-2 text-xs text-muted">{blurb}</p>}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="uppercase tracking-wide text-muted">{c.provider}</span>
                    <span className="font-semibold">{price(c.priceCents)}</span>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </section>

        <Card as="section" radius="lg" padding="xl" className="sm:p-8">
          <h2 className="font-display text-lg font-semibold">Training a team?</h2>
          <p className="mt-1 text-sm text-muted">
            Tell us what you need — volume pricing, learning paths, and compliance tracking included.
          </p>
          <div className="mt-4">
            <InquiryForm />
          </div>
        </Card>
      </main>
    </div>
  );
}
