"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Fires a first-party, cookieless pageview beacon (see analytics.service.ts) on every route
 *  change. No cookie/localStorage identifier is set, so there's nothing to gate behind a
 *  consent banner. Honors Do Not Track as a courtesy even though this isn't the kind of
 *  cross-site tracking DNT was built to stop. Mount once per public marketing header. */
export function PageviewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return;
    try {
      const body = JSON.stringify({ path: pathname, referrer: document.referrer || undefined });
      const blob = new Blob([body], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/v1/analytics/pageview", blob)) {
        void fetch("/api/v1/analytics/pageview", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
      }
    } catch {
      // best-effort only — analytics must never break the page
    }
  }, [pathname]);

  return null;
}
