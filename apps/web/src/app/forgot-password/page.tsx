"use client";

import { useState } from "react";
import Link from "next/link";
import { AUTH, AuthCard, AuthHeading, AuthShell } from "@/components/auth/AuthShell";
import { Chevron } from "@/components/ui";
import { isValidEmail } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // Format-only check — never reveals whether the address has an account, same as the
    // always-"sent" response below.
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setState("busy");
    try {
      await fetch("/api/v1/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setState("sent"); // same answer either way — this endpoint never reveals which emails exist
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading sub="Enter your email and we'll send a reset link. It works for 15 minutes.">
          Reset your password
        </AuthHeading>
        {state === "sent" ? (
          <p className="mt-5 text-sm" style={{ color: AUTH.ink }}>
            If an account exists for <span className="font-medium">{email}</span>, the reset link is on
            its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organization.com"
              style={{
                width: "100%", border: `1px solid ${AUTH.border}`, borderRadius: 10,
                background: AUTH.field, padding: "9px 12px", fontSize: 14, color: AUTH.ink, outline: "none",
              }}
            />
            {error && <p className="text-xs text-red" role="alert">{error}</p>}
            <button
              disabled={state === "busy"}
              className="w-full py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: AUTH.navy, borderRadius: 10 }}
            >
              {state === "busy" ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </AuthCard>
      <p className="mt-4 text-center text-xs">
        <Link href="/login" className="inline-flex items-center gap-1 hover:underline" style={{ color: AUTH.muted }}>
          <Chevron direction="left" /> Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
