/** Basic error monitoring (2026-08-05) — best-effort report to the API's ErrorLog + alert
 *  pipeline. Fire-and-forget and never throws: an error handler that itself fails must not
 *  produce a second, worse error. */
export function reportError(input: { message: string; stack?: string; meta?: Record<string, unknown> }) {
  try {
    const path = typeof window !== "undefined" ? window.location.pathname : undefined;
    void fetch("/api/v1/errors/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, path }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // swallow — reporting must never itself throw
  }
}
