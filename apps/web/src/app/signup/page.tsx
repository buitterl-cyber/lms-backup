"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { Button, Card, Chevron } from "@/components/ui";
import { isValidEmail } from "@/lib/validation";

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
    setError("");
    if (!form.firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
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

  const input = "min-h-12 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-base outline-none focus:border-brand sm:min-h-10 sm:rounded-lg sm:py-2 sm:text-sm";
  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-clip px-3 py-6 sm:px-6 sm:py-8">
      <div className="w-full max-w-sm sm:max-w-sm">
        <Link href="/" className="flex justify-center">
          <Brand size={30} className="text-lg sm:text-xl" />
        </Link>
        <Card as="form" onSubmit={submit} noValidate padding="lg" className="mt-5 sm:mt-8 sm:p-6">
          <h1 className="text-lg font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Free learner account — start a course in under a minute.</p>

          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" className={input} autoComplete="given-name" />
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" className={input} autoComplete="family-name" />
            </div>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@organization.com" className={input} autoComplete="email" />
            <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (8+ characters)" className={input} autoComplete="new-password" />
            {error && <p className="text-xs text-red">{error}</p>}
            <Button disabled={loading} className="min-h-12 w-full text-base sm:min-h-10 sm:text-sm">
              {loading ? "Creating account…" : <>Create account <Chevron className="ms-1" /></>}
            </Button>
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
                  <Button key={p.key} href={`/api/v1/auth/social/${p.key}`} variant="secondary" className="gap-2 hover:bg-bg!">
                    Continue with {p.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted">
            Already have an account? <Link href="/login" className="text-brand underline">Sign in</Link>
          </p>
        </Card>
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
