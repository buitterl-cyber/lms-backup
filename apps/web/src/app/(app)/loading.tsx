import { SkeletonLine, SkeletonMetric, SkeletonTable } from "@/components/ui";

/** Default loading skeleton for the (app) group — the sidebar/topbar (in layout.tsx) render
 *  immediately since they're a separate Server Component; this only covers the page content
 *  area while a specific page's own data fetch is in flight. Pages with a meaningfully
 *  different shape (learner, catalog, catalog/[id], my-learning, marketplace) override this
 *  with their own loading.tsx; everything else (compliance, team, instructor, skills,
 *  certifications, people, notifications, reports, providers, sales-inquiries, career, ai)
 *  shares this one, since "header + KPI row + table" is their common shape. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonLine className="h-7 w-56" />
        <SkeletonLine className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
      </div>
      <SkeletonTable />
    </div>
  );
}
