import Link from "next/link";
import { InquiryForm } from "@/components/InquiryForm";

// PUBLIC sales catalogue (Carl's "sales website"): best sellers up top, instant search across
// the whole catalogue, promotions, and an inquiry CTA that feeds the CRM pipeline.
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
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm">
          <Link href="/" className="text-lg font-semibold tracking-tight">Riyada<span className="text-brand">Intel</span></Link>
          <nav className="flex items-center gap-4">
            <Link href="/courses" className="font-medium text-fg">Courses</Link>
            <Link href="/login" className="text-muted hover:text-fg">Log in</Link>
            <Link href="/learner" className="rounded-lg bg-brand px-4 py-2 font-medium text-white">Launch platform</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <section className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Find your next course</h1>
          <p className="mt-2 text-sm text-muted">Search {featured?.catalogSize?.toLocaleString() ?? "the"} courses across every major provider.</p>
          <form action="/courses" className="mx-auto mt-5 flex max-w-xl gap-2">
            <input
              name="q" defaultValue={q} placeholder="Try ITIL, security, cloud, leadership…"
              className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <button type="submit" className="rounded-xl bg-brand px-5 py-3 text-sm font-medium text-white">Search</button>
          </form>
        </section>

        {featured && featured.promotions.length > 0 && (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featured.promotions.map((p) => (
              <div key={p.id} className="rounded-xl border border-amber/40 bg-amber/10 p-4">
                <p className="text-sm font-semibold">{p.title}{p.discountPct ? ` — ${p.discountPct}% off` : ""}</p>
                {p.subtitle && <p className="mt-1 text-xs text-muted">{p.subtitle}</p>}
              </div>
            ))}
          </section>
        )}

        {!q && featured && featured.bestSellers.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold tracking-tight">Best sellers</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.bestSellers.map((c) => (
                <Link key={c.id} href={`/courses/${c.id}`} className="group rounded-xl border border-border bg-card p-5 transition hover:border-brand/50">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber">Best seller</span>
                    <span className="text-sm font-semibold">{price(c.priceCents)}</span>
                  </div>
                  <p className="mt-3 font-medium group-hover:text-brand">{c.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{c.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-muted">{c.provider}{c.level ? ` · ${c.level}` : ""}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold tracking-tight">{q ? `Results for “${q}”` : "Browse the catalogue"}</h2>
          {results.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No courses matched — try a broader search.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((c) => (
                <Link key={c.id} href={`/courses/${c.id}`} className="group rounded-xl border border-border bg-card p-5 transition hover:border-brand/50">
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

        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Training a team?</h2>
          <p className="mt-1 text-sm text-muted">Tell us what you need — volume pricing, learning paths, and compliance tracking included.</p>
          <div className="mt-4"><InquiryForm /></div>
        </section>
      </main>
    </div>
  );
}
