import { Suspense } from "react";
import Link from "next/link";
import { AUTH, AuthCard, AuthHeading, AuthShell } from "@/components/auth/AuthShell";
import { PortalLoginForm } from "@/components/auth/PortalLoginForm";

// Admin/Manager sign-in → team dashboard. Server enforces the portal: accounts without an
// admin role are refused here and pointed to the learner door.
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading sub="Team dashboards, courses, and pipeline.">Admin / Manager sign in</AuthHeading>
        <div className="mt-5">
          <Suspense>
            <PortalLoginForm portal="admin" cta="Sign in to Admin Portal" redirect="/team" />
          </Suspense>
        </div>
      </AuthCard>
      <p className="mt-4 text-center text-xs">
        <Link href="/login" className="hover:underline" style={{ color: AUTH.muted }}>
          ← Not an admin? Go back
        </Link>
      </p>
      <p className="mt-2 text-center text-xs" style={{ color: AUTH.muted }}>
        Demo admin: amir@excis.com / demo1234
      </p>
    </AuthShell>
  );
}
