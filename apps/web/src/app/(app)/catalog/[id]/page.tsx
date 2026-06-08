import Link from "next/link";
import { Card } from "@/components/ui";
import { CoursePlayer } from "@/components/CoursePlayer";
import { apiGet, getContext, type CourseDetail } from "@/lib/api";

export const dynamic = "force-dynamic";

const PROVIDER_LABEL: Record<string, string> = {
  go1: "GO1", "ms-learn": "Microsoft Learn", aws: "AWS Skill Builder", cybrary: "Cybrary",
  oreilly: "O'Reilly", "open-sesame": "OpenSesame", "ai-generated": "AI Generated",
};

async function load(id: string) {
  try {
    const ctx = await getContext();
    return await apiGet<CourseDetail>(`/catalog/courses/${id}`, ctx);
  } catch {
    return null;
  }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await load(id);
  if (!course) {
    return (
      <Card>
        Course not found. <Link href="/catalog" className="text-brand underline">Back to catalog</Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/catalog" className="text-sm text-muted hover:text-fg">← Course Catalog</Link>

      <header>
        <p className="text-xs uppercase tracking-wide text-muted">
          {PROVIDER_LABEL[course.provider] ?? course.provider}
          {course.level ? ` · ${course.level}` : ""}
          {course.durationMinutes ? ` · ${Math.round(course.durationMinutes / 60)}h` : ""}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{course.title}</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="text-sm font-medium text-muted">About this course</h2>
            <p className="mt-2 text-sm leading-relaxed">{course.description}</p>
          </Card>
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
        <div>
          <CoursePlayer courseId={course.id} launchUrl={course.launchUrl} />
        </div>
      </div>
    </div>
  );
}
