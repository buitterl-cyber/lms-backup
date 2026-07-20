import Link from "next/link";
import { InquiryForm } from "@/components/InquiryForm";
import { PublicChrome } from "@/components/PublicChrome";
import { Button, Card } from "@/components/ui";

// PUBLIC sales catalogue — chrome matches the marketing homepage language.
export const dynamic = "force-dynamic";

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

      <main className="mx-auto max-w-[1280px] space-y-10 px-5 py-10 sm:px-6">
        <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 px-6 py-10 text-center shadow-[0_20px_50px_-30px_rgba(15,23,42,0.3)] backdrop-blur sm:px-10 sm:py-12">
          <div aria-hidden className="mkt-blob mkt-blob-a !opacity-40" />
          <div aria-hidden className="mkt-blob mkt-blob-b !opacity-30" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Content catalogue</p>
            <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Find training that closes the gaps you already see
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted sm:text-base">
              Search {featured?.catalogSize?.toLocaleString() ?? "the"} courses across connected providers — secondary to readiness, useful when you act.
            </p>
            <form action="/courses" className="mx-auto mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
              <input
                name="q"
                defaultValue={q}
                placeholder="Try ITIL, security, cloud, leadership…"
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-border bg-bg/70 px-4 text-sm outline-none focus:border-brand"
              />
              <Button type="submit" size="lg" className="min-h-12 rounded-xl sm:rounded-full sm:px-7">
                Search
              </Button>
            </form>
          </div>
        </section>

        {featured && featured.promotions.length > 0 && (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featured.promotions.map((p) => (
              <Card key={p.id} tone="amber" padding="md" radius="2xl" interactive>
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
              {featured.bestSellers.map((c) => (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber">
                      Best seller
                    </span>
                    <span className="text-sm font-semibold">{price(c.priceCents)}</span>
                  </div>
                  <p className="mt-3 font-medium group-hover:text-brand">{c.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{c.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-muted">
                    {c.provider}{c.level ? ` · ${c.level}` : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display text-lg font-semibold">{q ? `Results for “${q}”` : "Browse the catalogue"}</h2>
          {results.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No courses matched — try a broader search.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((c) => (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg"
                >
                  <p className="font-medium group-hover:text-brand">{c.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{c.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="uppercase tracking-wide text-muted">{c.provider}</span>
                    <span className="font-semibold">{price(c.priceCents)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Card as="section" radius="2xl" padding="xl" className="sm:p-8">
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
