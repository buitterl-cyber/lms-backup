import { Card, SkeletonLine } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonLine className="h-4 w-32" />
      <div className="space-y-2">
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-7 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <SkeletonLine className="h-3 w-32" />
            <SkeletonLine className="mt-3 h-3 w-full" />
            <SkeletonLine className="mt-2 h-3 w-5/6" />
            <SkeletonLine className="mt-2 h-3 w-2/3" />
          </Card>
          <Card padding="none">
            <div className="border-b border-border p-4"><SkeletonLine className="h-4 w-24" /></div>
            <div className="divide-y divide-border/60">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <SkeletonLine className="h-6 w-6 shrink-0 rounded-full" />
                  <SkeletonLine className="h-3 flex-1" />
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card><SkeletonLine className="h-3 w-20" /><SkeletonLine className="mt-3 h-2 w-full" /></Card>
          <Card><SkeletonLine className="h-3 w-24" /><SkeletonLine className="mt-3 h-8 w-full rounded-lg" /></Card>
          <Card><SkeletonLine className="h-3 w-28" /><SkeletonLine className="mt-3 h-8 w-full rounded-lg" /></Card>
        </div>
      </div>
    </div>
  );
}
