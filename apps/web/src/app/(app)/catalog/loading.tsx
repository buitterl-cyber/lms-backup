import { SkeletonCourseCard, SkeletonLine } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonLine className="h-7 w-56" />
        <SkeletonLine className="h-4 w-80" />
      </div>
      <div className="flex gap-2">
        <SkeletonLine className="h-6 w-24 rounded-full" />
        <SkeletonLine className="h-6 w-20 rounded-full" />
        <SkeletonLine className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCourseCard key={i} />)}
      </div>
    </div>
  );
}
