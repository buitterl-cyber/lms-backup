import { Card, SkeletonLine } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SkeletonLine className="h-7 w-40" />
        <SkeletonLine className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <SkeletonLine className="h-3 w-16" />
            <SkeletonLine className="mt-3 h-6 w-20" />
            <SkeletonLine className="mt-4 h-8 w-full rounded-lg" />
          </Card>
        ))}
      </div>
    </div>
  );
}
