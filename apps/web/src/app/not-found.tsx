import type { Metadata } from "next";
import { Brand } from "@/components/Brand";
import { Button, Card, StateIcon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Page Not Found — Riyada Intelligence",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <Brand size={30} className="mb-8 text-xl" />
      <Card className="flex max-w-md flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bg text-muted ring-1 ring-border">
          <StateIcon kind="search" />
        </span>
        <div>
          <h1 className="font-display text-lg font-semibold">Page not found</h1>
          <p className="mt-1 text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
        </div>
        <Button href="/" size="sm">Back home</Button>
      </Card>
    </div>
  );
}
