import { Button, Card, StateIcon } from "@/components/ui";

export default function NotFound() {
  return (
    <Card className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bg text-muted ring-1 ring-border">
        <StateIcon kind="search" />
      </span>
      <div>
        <h1 className="font-display text-lg font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-muted">That page doesn&apos;t exist or may have moved.</p>
      </div>
      <Button href="/learner" size="sm">Back to dashboard</Button>
    </Card>
  );
}
