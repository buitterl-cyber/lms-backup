import Link from "next/link";
import { InquiryForm } from "@/components/InquiryForm";
import { PublicChrome } from "@/components/PublicChrome";
import { Card, Chevron } from "@/components/ui";

// PUBLIC course page — same chrome language as marketing + catalogue.
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
      <div className="mkt-page min-h-screen">
        <PublicChrome active="courses" />
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p>Course not found.</p>
          <Link href="/courses" className="text-brand underline">
            Back to the catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mkt-page min-h-screen">
      <PublicChrome active="courses" />

      <main className="mx-auto max-w-4xl space-y-8 px-5 py-10 sm:px-6">
        <Link href="/courses" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <Chevron direction="left" /> All courses
        </Link>

        <header className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {course.bestSeller && (
              <span className="rounded-full bg-amber/15 px-2.5 py-0.5 font-semibold uppercase tracking-wide text-amber">
                Best seller
              </span>
            )}
            <span className="uppercase tracking-wide text-muted">
              {course.provider}
              {course.level ? ` · ${course.level}` : ""}
              {course.durationMinutes ? ` · ${Math.round(course.durationMinutes / 60)}h` : ""}
            </span>
          </div>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight">{course.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {course.rating && (
              <span className="text-amber">
                {"★".repeat(Math.round(course.rating))} <span className="text-fg">{course.rating}</span>{" "}
                <span className="text-muted">({course.ratingCount})</span>
              </span>
            )}
            <span className="font-semibold">
              {course.priceCents ? `$${(course.priceCents / 100).toFixed(0)}` : "Included in platform plans"}
            </span>
          </div>
        </header>

        <Card as="section" padding="xl" radius="2xl">
          <h2 className="text-sm font-medium text-muted">About this course</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{course.description}</p>
        </Card>

        {course.modules.length > 0 && (
          <Card as="section" padding="xl" radius="2xl">
            <h2 className="text-sm font-medium text-muted">What you&apos;ll cover</h2>
            <ol className="mt-3 space-y-2">
              {course.modules.map((m) => (
                <li key={m.position} className="flex items-baseline gap-3 rounded-xl border border-border/70 bg-bg/40 px-3 py-2.5 text-sm">
                  <span className="text-xs font-semibold text-accentTeal">{m.position}.</span>
                  <span>
                    <span className="font-medium">{m.title}</span>
                    {m.summary && <span className="text-muted"> — {m.summary}</span>}
                    {m.durationMinutes && <span className="text-xs text-muted"> · {m.durationMinutes} min</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        <Card as="section" tone="brand" radius="2xl" padding="xl">
          <h2 className="font-display text-lg font-semibold">Interested in this course?</h2>
          <p className="mt-1 text-sm text-muted">Leave your details and our team will get straight back to you.</p>
          <div className="mt-4">
            <InquiryForm courseId={course.id} courseTitle={course.title} />
          </div>
        </Card>
      </main>
    </div>
  );
}
