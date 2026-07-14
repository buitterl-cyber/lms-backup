import Link from "next/link";
import { InquiryForm } from "@/components/InquiryForm";

// PUBLIC course page: full description, module outline, rating — with the inquiry CTA.
export const dynamic = "force-dynamic";

const API = (process.env.API_INTERNAL_URL || process.env.API_URL || "http://localhost:4400") + "/api/v1";

interface PublicCourse {
  id: string; title: string; description: string; provider: string; level?: string | null;
  durationMinutes?: number | null; bestSeller: boolean; priceCents?: number | null;
  modules: { position: number; title: string; summary?: string | null; durationMinutes?: number | null }[];
  rating: number | null; ratingCount: number;
}

export default async function PublicCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await fetch(`${API}/sales/courses/${id}`, { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<PublicCourse>) : null))
    .catch(() => null);

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p>Course not found.</p>
        <Link href="/courses" className="text-brand underline">Back to the catalogue</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm">
          <Link href="/" className="text-lg font-semibold tracking-tight">Riyada<span className="text-brand">Intel</span></Link>
          <nav className="flex items-center gap-4">
            <Link href="/courses" className="text-muted hover:text-fg">Courses</Link>
            <Link href="/login" className="text-muted hover:text-fg">Log in</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <Link href="/courses" className="text-sm text-muted hover:text-fg">← All courses</Link>

        <header>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {course.bestSeller && <span className="rounded-full bg-amber/15 px-2.5 py-0.5 font-semibold uppercase tracking-wide text-amber">Best seller</span>}
            <span className="uppercase tracking-wide text-muted">{course.provider}{course.level ? ` · ${course.level}` : ""}{course.durationMinutes ? ` · ${Math.round(course.durationMinutes / 60)}h` : ""}</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{course.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm">
            {course.rating && (
              <span className="text-amber">{"★".repeat(Math.round(course.rating))} <span className="text-fg">{course.rating}</span> <span className="text-muted">({course.ratingCount})</span></span>
            )}
            <span className="font-semibold">{course.priceCents ? `$${(course.priceCents / 100).toFixed(0)}` : "Included in platform plans"}</span>
          </div>
        </header>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted">About this course</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{course.description}</p>
        </section>

        {course.modules.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-muted">What you&apos;ll cover</h2>
            <ol className="mt-3 space-y-2">
              {course.modules.map((m) => (
                <li key={m.position} className="flex items-baseline gap-3 text-sm">
                  <span className="text-xs font-semibold text-brand">{m.position}.</span>
                  <span>
                    <span className="font-medium">{m.title}</span>
                    {m.summary && <span className="text-muted"> — {m.summary}</span>}
                    {m.durationMinutes && <span className="text-xs text-muted"> · {m.durationMinutes} min</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="rounded-2xl border border-brand/30 bg-card p-6">
          <h2 className="text-lg font-semibold tracking-tight">Interested in this course?</h2>
          <p className="mt-1 text-sm text-muted">Leave your details and our team will get straight back to you.</p>
          <div className="mt-4"><InquiryForm courseId={course.id} courseTitle={course.title} /></div>
        </section>
      </main>
    </div>
  );
}
