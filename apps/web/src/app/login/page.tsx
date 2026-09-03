import type { Metadata } from "next";
import Link from "next/link";
import { AUTH, AuthShell } from "@/components/auth/AuthShell";
import { Chevron } from "@/components/ui";

export const metadata: Metadata = {
  title: "Log In — Riyada Intelligence",
  description: "Sign in to Riyada Intelligence as a learner or admin/manager.",
};

// Role selection — the front door. Two clear paths, nothing else.
export const dynamic = "force-dynamic";

const LOGIN_ERROR: Record<string, string> = {
  session_expired: "Your session ended — sign in again to continue.",
};

function RoleCard({
  href,
  title,
  description,
  cta,
  icon,
  accent,
}: {
  href: string;
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col p-6 transition duration-200 hover:-translate-y-1"
      style={{
        background: AUTH.card,
        border: `1px solid ${AUTH.border}`,
        borderRadius: 16,
        boxShadow: "0 18px 40px -24px rgb(var(--auth-ink) / 0.28)",
      }}
    >
      <span
        className="flex h-11 w-11 items-center justify-center transition group-hover:scale-105"
        style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent, borderRadius: 12 }}
      >
        {icon}
      </span>
      <span
        className="mt-4 text-base font-bold"
        style={{ fontFamily: "var(--font-auth), Inter, sans-serif", color: AUTH.ink }}
      >
        {title}
      </span>
      <span className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: AUTH.muted }}>
        {description}
      </span>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: accent }}>
        {cta} <Chevron />
      </span>
    </Link>
  );
}

export default async function RoleSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? LOGIN_ERROR[error] : undefined;
  return (
    <AuthShell width="max-w-2xl">
      <h1
        className="text-center text-xl font-bold"
        style={{ fontFamily: "var(--font-auth), Inter, sans-serif", color: AUTH.ink }}
      >
        Welcome back
      </h1>
      <p className="mt-1 text-center text-sm" style={{ color: AUTH.muted }}>
        Choose how you want to sign in.
      </p>
      {errorMessage && (
        <p className="mt-4 text-center text-sm text-red" role="alert">{errorMessage}</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RoleCard
          href="/login/learner"
          title="I'm a Learner"
          description="Take courses, track your progress, keep your streak alive."
          cta="Sign in to Learning Portal"
          accent={AUTH.gold}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10 12 5 2 10l10 5 10-5z" />
              <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
            </svg>
          }
        />
        <RoleCard
          href="/login/admin"
          title="I'm an Admin / Manager"
          description="Team dashboards, nudges, courses, and the sales pipeline."
          cta="Sign in to Admin Portal"
          accent={AUTH.navy}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 15v-4M12 15V8M17 15v-7" />
            </svg>
          }
        />
      </div>

      <p className="mt-6 text-center text-xs" style={{ color: AUTH.muted }}>
        New here?{" "}
        <Link href="/signup" className="font-medium hover:underline" style={{ color: AUTH.navy }}>
          Create a learner account
        </Link>
      </p>
    </AuthShell>
  );
}
