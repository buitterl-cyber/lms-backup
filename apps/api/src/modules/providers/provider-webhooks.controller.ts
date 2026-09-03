import { Controller, HttpCode, Param, Post, Req, Res } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request, Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../../common/prisma/prisma.service";

/**
 * Inbound webhook receiver for connected content providers (GO1 first, same shape reusable for
 * any future provider that pushes events). Necessarily public — GO1 will never present one of our
 * user JWTs — so trust comes from (a) the connectionId in the path resolving to a known, active
 * ProviderConnection, and (b) an HMAC signature check against that provider's webhook secret, once
 * we know the real scheme GO1 uses. See tenant.middleware.ts PUBLIC_SEGMENTS for why this path is
 * allowed to skip the normal Bearer-JWT requirement.
 *
 * STATUS (2026-08-03): we do NOT yet know whether GO1 delivers completions via webhook or expects
 * polling (see jobs/provider-progress-poll.job.ts for that alternative), nor its signature header
 * name, HMAC algorithm, or event payload shape — no GO1 API docs yet (waiting on Luke Barnes).
 * This endpoint is deliberately generic and interpretation-free: it authenticates what it can,
 * durably stores the raw event (ProviderWebhookEvent), and defers mapping the payload to an
 * enrollment until we know the schema. Nothing is lost by waiting — the event just sits at
 * status "received" until a follow-up fills in the real parsing logic.
 */
@Controller("providers/webhooks")
export class ProviderWebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  @Post(":providerKey/:connectionId")
  @HttpCode(200)
  async receive(
    @Param("providerKey") providerKey: string,
    @Param("connectionId") connectionId: string,
    @Req() req: RawBodyRequest<Request>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const conn = await this.prisma.db.providerConnection.findFirst({
      where: { id: connectionId, providerKey, status: "active" },
    });
    if (!conn) {
      res.status(404);
      return { ok: false, reason: "unknown_connection" };
    }

    const secret = webhookSecretFor(providerKey);
    // TODO(GO1 docs): confirm the real signature header name and algorithm — this checks the two
    // most common conventions (a generic header and a GO1-specific-sounding one) as placeholders.
    const signatureHeader = req.headers["x-webhook-signature"] ?? req.headers["x-go1-signature"];
    const signature = typeof signatureHeader === "string" ? signatureHeader : undefined;

    if (secret) {
      if (!verifySignature(req.rawBody, signature, secret)) {
        await this.prisma.db.providerWebhookEvent.create({
          data: {
            tenantId: conn.tenantId, connectionId: conn.id, providerKey,
            payload: safeJson(req.body), status: "failed", error: "signature_verification_failed",
          },
        });
        res.status(401);
        return { ok: false, reason: "invalid_signature" };
      }
    }

    await this.prisma.db.providerWebhookEvent.create({
      data: {
        tenantId: conn.tenantId,
        connectionId: conn.id,
        providerKey,
        payload: safeJson(req.body),
        status: "received",
        error: secret ? undefined : "no_webhook_secret_configured — signature not verified (pre-GO1-docs placeholder state)",
      },
    });

    // TODO(GO1 docs): once the real event shape is known, look up the matching Enrollment (by
    // externalEnrollmentId, or externalLearnerId+externalCourseId via ProviderLearnerLink) and
    // call EnrollmentService.setProgress() inside runWithTenant({ tenantId: conn.tenantId, ... }).
    return { ok: true };
  }
}

function webhookSecretFor(providerKey: string): string | undefined {
  const envKey = `${providerKey.toUpperCase().replace(/-/g, "_")}_WEBHOOK_SECRET`;
  return process.env[envKey] || undefined;
}

function verifySignature(rawBody: Buffer | undefined, signature: string | undefined, secret: string): boolean {
  if (!rawBody || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function safeJson(body: unknown) {
  try {
    return JSON.parse(JSON.stringify(body ?? {}));
  } catch {
    return {};
  }
}
