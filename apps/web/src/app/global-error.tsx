"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

/** Catches errors in the root layout itself (cookie/locale resolution, font loading, etc.) —
 *  deliberately self-contained with inline styles, not the design system, since if the root
 *  layout failed we can't assume globals.css/tokens initialized cleanly. Replaces <html>/<body>
 *  entirely, per Next.js's global-error convention. reportError is a plain fetch call with no
 *  styling/token dependency, so it's safe to use here even though the rest of the design system
 *  isn't trusted in this boundary. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError({ message: error.message, stack: error.stack, meta: { digest: error.digest, kind: "global-error-boundary" } });
  }, [error]);

  return (
    <html lang="en" dir="ltr">
      <body
        style={{
          minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: 24, textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "#71778a", maxWidth: 380 }}>
          A critical error occurred loading the app. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 16, borderRadius: 8, background: "#1e3a6e", color: "#fff", padding: "8px 16px",
            fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
