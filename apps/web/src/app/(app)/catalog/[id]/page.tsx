import Link from "next/link";
import { Card } from "@/components/ui";
import { CoursePlayer } from "@/components/CoursePlayer";
import { ModuleList, type ModuleRow } from "@/components/ModuleList";
import { RateCourse } from "@/components/RateCourse";
import { apiGet, getContext, type CourseDetail } from "@/lib/api";

export const dynamic = "force-dynamic";

const PROVIDER_LABEL: Record<string, string> = {
  go1: "GO1", "ms-learn": "Microsoft Learn", aws: "AWS Skill Builder", cybrary: "Cybrary",
  oreilly: "O'Reilly", "open-sesame": "OpenSesame", "ai-generated": "AI Generated",
};

async function load(id: string) {
  try {
    const ctx = await getContext();
    const [course, modules] = await Promise.all([
      apiGet<CourseDetail>(`/catalog/courses/${id}`, ctx),
      apiGet<ModuleRow[]>(`/courses/${id}/modules`, ctx).catch(() => [] as ModuleRow[]),
    ]);
    return { ctx, course, modules };
  } catch {
    return null;
  }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await load(id);
  const course = loaded?.course;
  if (!loaded || !course) {
    return (
      <Card>
        Course not found. <Link href="/catalog" className="text-brand underline">Back to catalog</Link>
      </Card>
    );
  }

  const { ctx, modules } = loaded;
  return (
    <div className="space-y-6">
      <Link href="/catalog" className="text-sm text-muted hover:text-fg">← Course Catalog</Link>

      <header>
        <p className="text-xs uppercase tracking-wide text-muted">
          {PROVIDER_LABEL[course.provider] ?? course.provider}
          {course.level ? ` · ${course.level}` : ""}
          {course.durationMinutes ? ` · ${Math.round(course.durationMinutes / 60)}h` : ""}
        </p>
        <h1 className="font-display mt-1 text-2xl font-semibold">{course.title}</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="text-sm font-medium text-muted">About this course</h2>
            <p className="mt-2 text-sm leading-relaxed">{course.description}</p>
          </Card>
          {modules.length > 0 && (
            <Card className="p-0">
              <div className="border-b border-border p-4">
                <h2 className="text-sm font-medium">Modules</h2>
                <p className="text-xs text-muted">{modules.filter((m) => m.completed).length} of {modules.length} complete · unlocked in order</p>
              </div>
              <div className="px-4">
                <ModuleList ctx={ctx} modules={modules} />
              </div>
            </Card>
          )}
          {course.skills.length > 0 && (
            <Card>
              <h2 className="text-sm font-medium text-muted">Skills you&apos;ll build</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {course.skills.map((s) => (
                  <span key={s} className="rounded-full bg-bg px-3 py-1 text-xs text-fg ring-1 ring-border">{s}</span>
                ))}
              </div>
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <CoursePlayer courseId={course.id} launchUrl={course.launchUrl} />
          <Card>
            <h2 className="text-sm font-medium">Course forum</h2>
            <p className="mt-1 text-xs text-muted">Questions, answers, and the AI Study Assistant.</p>
            <Link href={`/catalog/${course.id}/forum`} className="mt-3 block rounded-lg border border-brand/40 px-3 py-2 text-center text-sm font-medium text-brand hover:bg-brand/10">
              Open forum →
            </Link>
          </Card>
          <Card>
            <h2 className="text-sm font-medium">Rate this course</h2>
            <div className="mt-2"><RateCourse ctx={ctx} courseId={course.id} /></div>
          </Card>
          {course.assessmentId && (
            <Card>
              <h2 className="text-sm font-medium">Knowledge check</h2>
              <p className="mt-1 text-xs text-muted">Test what you learned and earn your completion.</p>
              <Link href={`/assessment/${course.assessmentId}`} className="mt-3 block rounded-lg bg-brand px-3 py-2 text-center text-sm font-medium text-white">
                Take assessment →
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
