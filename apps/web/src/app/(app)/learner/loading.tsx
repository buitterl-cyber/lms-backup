import { Card, SkeletonLine } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonLine className="h-7 w-64" />
        <SkeletonLine className="h-4 w-48" />
      </div>

      {/* Resume hero */}
      <div className="rounded-xl bg-border/40 p-6">
        <SkeletonLine className="h-3 w-32 bg-border/70" />
        <SkeletonLine className="mt-3 h-5 w-56 bg-border/70" />
        <SkeletonLine className="mt-5 h-[5px] w-full bg-border/70" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <SkeletonLine className="h-3 w-20" />
          <div className="mt-3 flex justify-between">
            {Array.from({ length: 7 }).map((_, i) => <SkeletonLine key={i} className="h-8 w-8 rounded-full" />)}
          </div>
        </Card>
        <Card>
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="mt-3 h-7 w-16" />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <SkeletonLine className="h-10 w-10 shrink-0 rounded-lg" />
              <SkeletonLine className="h-4 flex-1" />
            </div>
            <SkeletonLine className="mt-3 h-[5px] w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
