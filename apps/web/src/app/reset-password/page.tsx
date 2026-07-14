"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AUTH, AuthCard, AuthHeading, AuthShell } from "@/components/auth/AuthShell";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState(token ? "" : "This reset link is incomplete — request a new one.");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError("");
    try {
      const res = await fetch("/api/v1/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed — request a new link.");
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className="mt-5 text-sm" style={{ color: AUTH.ink }}>
        Password updated ✓ —{" "}
        <Link href="/login" className="font-medium hover:underline" style={{ color: AUTH.navy }}>
          sign in with your new password
        </Link>
        .
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="mt-5 space-y-3">
      <input
        required
        type="password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password (8+ characters)"
        style={{
          width: "100%", border: `1px solid ${AUTH.border}`, borderRadius: 10,
          background: AUTH.field, padding: "9px 12px", fontSize: 14, color: AUTH.ink, outline: "none",
        }}
      />
      {error && <p className="text-xs" style={{ color: "#C0392B" }}>{error}</p>}
      <button
        disabled={state === "busy" || !token}
        className="w-full py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: AUTH.navy, borderRadius: 10 }}
      >
        {state === "busy" ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading sub="Choose a new password for your account.">New password</AuthHeading>
        <Suspense>
          <ResetForm />
        </Suspense>
      </AuthCard>
      <p className="mt-4 text-center text-xs">
        <Link href="/forgot-password" className="hover:underline" style={{ color: AUTH.muted }}>Request a new link</Link>
      </p>
    </AuthShell>
  );
}
