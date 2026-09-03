import { Button, Card } from "@/components/ui";

/** Shown when a learner account opens an admin/manager surface. */
export function AccessDenied() {
  return (
    <Card className="mx-auto max-w-md text-center">
      <p className="text-2xl">🔒</p>
      <h1 className="font-display mt-2 text-lg font-semibold">Admins only</h1>
      <p className="mt-1 text-sm text-muted">
        This area is for admin and manager accounts. If you should have access, ask your
        organization admin to grant it.
      </p>
      <Button href="/learner" className="mt-4">
        Back to my dashboard
      </Button>
    </Card>
  );
}
