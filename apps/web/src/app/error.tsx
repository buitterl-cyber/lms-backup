"use client";

import { useEffect } from "react";
import { Brand } from "@/components/Brand";
import { Button, Card, StateIcon } from "@/components/ui";
import { reportError } from "@/lib/report-error";

/** Root-level boundary for the marketing/auth routes (no sidebar context here). */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    reportError({ message: error.message, stack: error.stack, meta: { digest: error.digest, kind: "error-boundary" } });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <Brand size={30} className="mb-8 text-xl" />
      <Card className="flex max-w-md flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red/10 text-red">
          <StateIcon kind="alert" />
        </span>
        <div>
          <h1 className="font-display text-lg font-semibold">Something went wrong</h1>
          <p className="mt-1 text-sm text-muted">
            An unexpected error occurred. It&apos;s been logged — try again, or head back home.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={reset} size="sm">Try again</Button>
          <Button href="/" variant="secondary" size="sm">Back home</Button>
        </div>
      </Card>
    </div>
  );
}
