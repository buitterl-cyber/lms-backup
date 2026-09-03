"use client";

import { useEffect } from "react";
import { Button, Card, StateIcon } from "@/components/ui";

/** Scoped to the (app) group so the sidebar/topbar (in layout.tsx, a separate Server Component)
 *  stays visible — one page erroring shouldn't take out navigation. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red/10 text-red">
        <StateIcon kind="alert" />
      </span>
      <div>
        <h1 className="font-display text-lg font-semibold">Something went wrong</h1>
        <p className="mt-1 text-sm text-muted">
          This page hit an unexpected error. It&apos;s been logged — try again, or head back to your dashboard.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} size="sm">Try again</Button>
        <Button href="/learner" variant="secondary" size="sm">Back to dashboard</Button>
      </div>
    </Card>
  );
}
