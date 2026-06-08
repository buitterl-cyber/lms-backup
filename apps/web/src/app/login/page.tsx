"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Real login: POSTs to /auth/login, stores the JWT in the riyada_token cookie, redirects into the
// app. Real auth (SSO via Keycloak) is the production path; this is the email/password fallback.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("amir@excis.com");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("bad");
      const { token } = await res.json();
      document.cookie = `riyada_token=${encodeURIComponent(token)}; path=/; max-age=43200; samesite=lax`;
      router.push("/learner");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-lg font-semibold tracking-tight">
          Riyada<span className="text-brand">Intel</span>
        </Link>
        <form onSubmit={submit} className="mt-8 rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Workforce Intelligence Platform</p>

          <div className="mt-5 space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organization.com"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
            {error && <p className="text-xs text-red">{error}</p>}
            <button disabled={loading} className="w-full rounded-lg bg-brand px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            Demo: <span className="text-fg">amir@excis.com</span> / <span className="text-fg">demo1234</span> (pre-filled)
          </p>
        </form>
        <p className="mt-4 text-center text-xs text-muted">Production: SSO/SAML + SCIM, MFA, 13 RBAC roles.</p>
      </div>
    </div>
  );
}
