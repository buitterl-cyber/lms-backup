import { Card, SkeletonLine } from "@/components/ui";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <SkeletonLine className="h-6 w-32" />
          <SkeletonLine className="h-6 w-24" />
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <SkeletonLine className="h-4 w-28" />
        <div className="space-y-2">
          <SkeletonLine className="h-3 w-40" />
          <SkeletonLine className="h-8 w-full max-w-lg" />
        </div>
        <Card>
          <SkeletonLine className="h-3 w-32" />
          <SkeletonLine className="mt-3 h-3 w-full" />
          <SkeletonLine className="mt-2 h-3 w-5/6" />
        </Card>
        <Card>
          <SkeletonLine className="h-3 w-32" />
          <SkeletonLine className="mt-3 h-9 w-full rounded-xl" />
        </Card>
      </main>
    </div>
  );
}
