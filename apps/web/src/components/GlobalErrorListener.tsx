"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

/** Catches JS errors React's error boundaries never see — thrown in event handlers, timers, or
 *  unhandled promise rejections. Render-phase errors are already caught by error.tsx/global-
 *  error.tsx; this is the complementary "everything else" net. Renders nothing, mount once in
 *  the root layout. */
export function GlobalErrorListener() {
  useEffect(() => {
    function onError(e: ErrorEvent) {
      reportError({ message: e.message, stack: e.error?.stack, meta: { kind: "window.onerror" } });
    }
    function onRejection(e: PromiseRejectionEvent) {
      const reason = e.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      reportError({ message, stack, meta: { kind: "unhandledrejection" } });
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
