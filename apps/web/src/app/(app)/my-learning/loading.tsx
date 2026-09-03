import { SkeletonLine, SkeletonTable } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-2">
          <SkeletonLine className="h-7 w-40" />
          <SkeletonLine className="h-4 w-32" />
        </div>
        <SkeletonLine className="h-9 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}
