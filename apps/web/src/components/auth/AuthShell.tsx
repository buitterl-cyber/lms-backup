/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import Link from "next/link";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-auth" });

/** Fixed-brand shell for auth surfaces — same soft atmosphere as marketing, official navy/gold. */
export const AUTH = {
  navy: "rgb(var(--auth-brand))",
  gold: "rgb(var(--brand-gold))",
  goldInk: "rgb(var(--brand-gold-ink))",
  ink: "rgb(var(--auth-ink))",
  muted: "rgb(var(--auth-muted))",
  border: "rgb(var(--auth-border))",
  field: "rgb(var(--auth-field))",
  card: "rgb(var(--auth-card))",
};

export function AuthShell({ children, width = "max-w-sm" }: { children: ReactNode; width?: string }) {
  return (
    <div
      className={`${dmSans.variable} relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10`}
      style={{ background: AUTH.field, color: AUTH.ink }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-70 blur-3xl"
        style={{ background: "rgb(var(--accent-teal) / 0.18)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full opacity-60 blur-3xl"
        style={{ background: "rgb(var(--auth-brand) / 0.14)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 left-1/3 h-52 w-52 rounded-full opacity-50 blur-3xl"
        style={{ background: "rgb(var(--brand-gold) / 0.16)" }}
      />

      <Link href="/" className="relative mb-8">
        <img src="/brand/riyada-logo.png" alt="Riyada Intelligence" width={200} height={65} />
      </Link>
      <div className={`relative w-full ${width}`}>{children}</div>
      <p className="relative mt-8 text-center text-xs" style={{ color: AUTH.muted }}>
        Riyada Intelligence · AI-Powered Workforce Intelligence
      </p>
    </div>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="p-6 sm:p-7"
      style={{
        background: AUTH.card,
        border: `1px solid ${AUTH.border}`,
        borderRadius: 16,
        boxShadow: "0 18px 48px -24px rgb(var(--auth-ink) / 0.28)",
      }}
    >
      {children}
    </div>
  );
}

export function AuthHeading({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div>
      <h1 className="text-lg font-bold" style={{ fontFamily: "var(--font-auth), Inter, sans-serif", color: AUTH.ink }}>
        {children}
      </h1>
      {sub && (
        <p className="mt-1 text-sm" style={{ color: AUTH.muted }}>
          {sub}
        </p>
      )}
    </div>
  );
}
