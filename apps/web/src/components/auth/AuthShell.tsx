/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import Link from "next/link";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-auth" });

/** Fixed-brand shell for the auth surfaces (role selection, sign-in, password reset).
 *  These pages are pre-login and marketing-adjacent, so they always wear the official
 *  palette — navy #1E3A6E, gold #F5A623, white cards on a cool white field — regardless
 *  of any skin cookie. DM Sans carries headings here per the wireframe; no gradients. */
export const AUTH = {
  navy: "#1E3A6E",
  gold: "#F5A623",
  ink: "#16233C",
  muted: "#6B7688",
  border: "#E2E5EA",
  field: "#F7F9FC",
  card: "#FFFFFF",
};

export function AuthShell({ children, width = "max-w-sm" }: { children: ReactNode; width?: string }) {
  return (
    <div
      className={`${dmSans.variable} flex min-h-screen flex-col items-center justify-center px-6 py-10`}
      style={{ background: AUTH.field, color: AUTH.ink }}
    >
      <Link href="/" className="mb-8">
        <img src="/brand/riyada-logo.png" alt="Riyada Intelligence" width={200} height={65} />
      </Link>
      <div className={`w-full ${width}`}>{children}</div>
      <p className="mt-8 text-center text-xs" style={{ color: AUTH.muted }}>
        Riyada Intelligence · AI-Powered Workforce Intelligence
      </p>
    </div>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="p-6"
      style={{
        background: AUTH.card,
        border: `1px solid ${AUTH.border}`,
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(22, 35, 60, 0.06)",
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
      {sub && <p className="mt-1 text-sm" style={{ color: AUTH.muted }}>{sub}</p>}
    </div>
  );
}
