import { SkeletonCourseCard, SkeletonLine } from "@/components/ui";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <SkeletonLine className="h-6 w-32" />
          <SkeletonLine className="h-6 w-24" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <div className="mx-auto max-w-xl space-y-3 text-center">
          <SkeletonLine className="mx-auto h-8 w-72" />
          <SkeletonLine className="mx-auto h-4 w-56" />
          <SkeletonLine className="mx-auto mt-4 h-12 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCourseCard key={i} />)}
        </div>
      </main>
    </div>
  );
}
