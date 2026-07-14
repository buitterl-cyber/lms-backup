"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { Suspense } from "react";

// Real login: POSTs to /auth/login, stores the JWT in the riyada_token cookie, redirects into the
// app. Social sign-in/signup buttons appear per configured provider (/auth/social/providers) and
// hand the browser to the provider; the API callback sets the same cookie and lands in /learner.

const SOCIAL_ICON: Record<string, string> = {
  google: "G",
  microsoft: "⊞",
  apple: "",
  facebook: "f",
  linkedin: "in",
};

const SOCIAL_ERROR: Record<string, string> = {
  social_cancelled: "Sign-in was cancelled — try again when you're ready.",
  social_not_configured: "That sign-in method isn't configured yet.",
  social_bad_state: "That sign-in link expired — please try again.",
  social_token_failed: "The provider rejected the sign-in — please try again.",
  social_failed: "Social sign-in failed — please try again.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("amir@excis.com");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState(() => SOCIAL_ERROR[params.get("error") ?? ""] ?? "");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<{ key: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/v1/auth/social/providers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

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
        <Link href="/" className="flex justify-center">
          <Brand size={30} className="text-xl" />
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

          {providers.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted">
                <span className="h-px flex-1 bg-border" />
                or continue with
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {providers.map((p) => (
                  <a
                    key={p.key}
                    href={`/api/v1/auth/social/${p.key}`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-bg"
                  >
                    <span className="w-5 text-center font-semibold">{SOCIAL_ICON[p.key] ?? "•"}</span>
                    Continue with {p.label}
                  </a>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-muted">New here? Any of these creates your account instantly.</p>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted">
            New here? <Link href="/signup" className="text-brand underline">Create an account</Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted">
            Demo: <span className="text-fg">amir@excis.com</span> / <span className="text-fg">demo1234</span> (pre-filled)
          </p>
        </form>
        <p className="mt-4 text-center text-xs text-muted">Production: SSO/SAML + SCIM, MFA, 13 RBAC roles.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
