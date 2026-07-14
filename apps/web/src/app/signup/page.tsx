"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/Brand";

// Email/password signup (learner account, logged in immediately) + the social providers as
// one-click signup when configured.
function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
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
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed — please try again.");
      document.cookie = `riyada_token=${encodeURIComponent(data.token)}; path=/; max-age=43200; samesite=lax`;
      router.push("/learner");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand";
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center">
          <Brand size={30} className="text-xl" />
        </Link>
        <form onSubmit={submit} className="mt-8 rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Free learner account — start a course in under a minute.</p>

          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" className={input} />
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" className={input} />
            </div>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@organization.com" className={input} />
            <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (8+ characters)" className={input} />
            {error && <p className="text-xs text-red">{error}</p>}
            <button disabled={loading} className="w-full rounded-lg bg-brand px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60">
              {loading ? "Creating account…" : "Create account →"}
            </button>
          </div>

          {providers.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted">
                <span className="h-px flex-1 bg-border" />
                or sign up with
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {providers.map((p) => (
                  <a key={p.key} href={`/api/v1/auth/social/${p.key}`} className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-bg">
                    Continue with {p.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted">
            Already have an account? <Link href="/login" className="text-brand underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
