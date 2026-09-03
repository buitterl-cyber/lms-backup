import crypto from "node:crypto";
import { prisma } from "@riyada/database";
import { MailerService } from "../mailer/mailer.service";

/**
 * Basic error monitoring (2026-08-05). Not tenant-scoped and deliberately independent of Nest's
 * DI container — the global exception filter that calls this runs outside a request's tenant
 * context (and sometimes before Nest DI has anything to inject into), so this is a plain module
 * with its own MailerService instance rather than an @Injectable service. The controller in
 * errors.module.ts calls the same `recordError` function, so the throttle map below is shared
 * across both entry points (Node module cache = single instance either way).
 */

const mailer = new MailerService();
const ALERT_TO = process.env.ERROR_ALERT_EMAIL || process.env.SALES_EMAIL || "carl@riyadaintel.com";
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // suppress repeat alerts for the same error for 15min

// In-memory — fine for a single PM2 fork instance (this deployment isn't clustered). Resets on
// restart, which just means the next occurrence after a deploy re-alerts once; acceptable for a
// "basic" alerting setup.
const lastAlertedAt = new Map<string, number>();

export interface ErrorReport {
  source: "api" | "web";
  message: string;
  stack?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  meta?: Record<string, unknown>;
}

function fingerprint(r: ErrorReport): string {
  const basis = `${r.source}:${r.statusCode ?? ""}:${r.path ?? ""}:${r.message}`.slice(0, 500);
  return crypto.createHash("sha1").update(basis).digest("hex").slice(0, 16);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Persist an error and, if it's severe and hasn't alerted recently, email it. Never throws —
 *  a broken monitoring path must not become a second outage on top of the one it's reporting. */
export async function recordError(r: ErrorReport): Promise<void> {
  const fp = fingerprint(r);

  try {
    await prisma.errorLog.create({
      data: {
        source: r.source,
        message: r.message.slice(0, 2000),
        stack: r.stack?.slice(0, 8000),
        path: r.path,
        method: r.method,
        statusCode: r.statusCode,
        fingerprint: fp,
        meta: r.meta as never,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[error-log] failed to persist:", err);
  }

  const severe = (r.statusCode ?? 500) >= 500;
  if (!severe) return;

  const now = Date.now();
  const last = lastAlertedAt.get(fp);
  if (last && now - last < ALERT_COOLDOWN_MS) return;
  lastAlertedAt.set(fp, now);

  try {
    await mailer.send(
      ALERT_TO,
      `[Riyada alert] ${r.source.toUpperCase()} error: ${r.message.slice(0, 120)}`,
      `<p><strong>Source:</strong> ${r.source}</p>
       ${r.path ? `<p><strong>Path:</strong> ${r.method ?? ""} ${escapeHtml(r.path)}</p>` : ""}
       ${r.statusCode ? `<p><strong>Status:</strong> ${r.statusCode}</p>` : ""}
       <p><strong>Message:</strong> ${escapeHtml(r.message)}</p>
       ${r.stack ? `<pre style="white-space:pre-wrap;font-size:12px;background:#f4f5f7;padding:12px;border-radius:8px;">${escapeHtml(r.stack.slice(0, 3000))}</pre>` : ""}
       <p style="color:#71778a;font-size:12px;">Further occurrences of this exact error are suppressed for 15 minutes to avoid alert flooding.</p>`,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[error-log] failed to send alert email:", err);
  }
}
