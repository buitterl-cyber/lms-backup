"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AUTH } from "@/components/auth/AuthShell";

const SOCIAL_ERROR: Record<string, string> = {
  social_cancelled: "Sign-in was cancelled — try again when you're ready.",
  social_not_configured: "That sign-in method isn't configured yet.",
  social_bad_state: "That sign-in link expired — please try again.",
  social_token_failed: "The provider rejected the sign-in — please try again.",
  social_failed: "Social sign-in failed — please try again.",
};

/** One form, two portals. The portal flag is enforced server-side: a learner-only account is
 *  refused at the admin door with a clear message; success routes to the right dashboard. */
export function PortalLoginForm({
  portal,
  cta,
  redirect,
  showSocial = false,
}: {
  portal: "learner" | "admin";
  cta: string;
  redirect: string;
  showSocial?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => SOCIAL_ERROR[params.get("error") ?? ""] ?? "");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<{ key: string; label: string }[]>([]);

  useEffect(() => {
    if (!showSocial) return;
    fetch("/api/v1/auth/social/providers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProviders)
      .catch(() => setProviders([]));
  }, [showSocial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.detail === undefined
            ? "Sign-in failed — please try again."
            : data.detail,
        );
      }
      document.cookie = `riyada_token=${encodeURIComponent(data.token)}; path=/; max-age=43200; samesite=lax`;
      router.push(redirect);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const input: React.CSSProperties = {
    width: "100%",
    border: `1px solid ${AUTH.border}`,
    borderRadius: 10,
    background: AUTH.field,
    padding: "9px 12px",
    fontSize: 14,
    color: AUTH.ink,
    outline: "none",
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@organization.com"
        style={input}
      />
      <input
        required
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        style={input}
      />
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: AUTH.navy }}>
          Forgot password?
        </Link>
      </div>
      {error && <p className="text-xs" style={{ color: "#C0392B" }}>{error}</p>}
      <button
        disabled={loading}
        className="w-full py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: portal === "admin" ? AUTH.navy : AUTH.gold, color: portal === "admin" ? "#fff" : "#3A2A05", borderRadius: 10 }}
      >
        {loading ? "Signing in…" : cta}
      </button>

      {showSocial && providers.length > 0 && (
        <div>
          <div className="flex items-center gap-3 pt-2 text-[10px] uppercase tracking-widest" style={{ color: AUTH.muted }}>
            <span className="h-px flex-1" style={{ background: AUTH.border }} />
            or continue with
            <span className="h-px flex-1" style={{ background: AUTH.border }} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {providers.map((p) => (
              <a
                key={p.key}
                href={`/api/v1/auth/social/${p.key}`}
                className="block py-2 text-center text-sm font-medium"
                style={{ border: `1px solid ${AUTH.border}`, borderRadius: 10, color: AUTH.ink }}
              >
                Continue with {p.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
