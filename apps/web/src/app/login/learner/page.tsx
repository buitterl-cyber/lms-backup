import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AUTH, AuthCard, AuthHeading, AuthShell } from "@/components/auth/AuthShell";
import { PortalLoginForm } from "@/components/auth/PortalLoginForm";
import { Chevron } from "@/components/ui";

export const metadata: Metadata = {
  title: "Learner Sign In — Riyada Intelligence",
  description: "Sign in to continue your courses and track your progress.",
};

// Learner sign-in → learner dashboard. Social sign-in lives here (learners self-serve).
export const dynamic = "force-dynamic";

export default function LearnerLoginPage() {
  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading sub="Pick up where you left off.">Learner sign in</AuthHeading>
        <div className="mt-5">
          <Suspense>
            <PortalLoginForm portal="learner" cta="Sign in to Learning Portal" redirect="/learner" showSocial />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-xs" style={{ color: AUTH.muted }}>
          New here?{" "}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: AUTH.navy }}>
            Create an account
          </Link>
        </p>
      </AuthCard>
      <p className="mt-4 text-center text-xs">
        <Link href="/login" className="inline-flex items-center gap-1 hover:underline" style={{ color: AUTH.muted }}>
          <Chevron direction="left" /> Not a learner? Go back
        </Link>
      </p>
    </AuthShell>
  );
}
