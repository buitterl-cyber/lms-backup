import { Injectable, Logger } from "@nestjs/common";
import { DomainError } from "@riyada/shared";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuthService, type JwtClaims } from "./auth.service";

// Fails loudly rather than silently signing/verifying with a publicly-known default — a missing
// JWT_SECRET in production is a total auth-bypass waiting to happen, not something to paper over.
const secret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is not set — refusing to run with an insecure default in production");
  }
  return "dev-insecure-secret";
};
const PUBLIC_URL = () => process.env.WEB_URL || "https://lms.excisone.com";
const redirectUri = (provider: string) => `${PUBLIC_URL()}/api/v1/auth/social/${provider}/callback`;

/** Normalized profile every provider resolves to. */
interface SocialProfile {
  providerUserId: string;
  email: string | null;
  firstName: string;
  lastName: string;
}

interface ProviderDef {
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  /** Extra authorize params (e.g. Apple's form_post). */
  extraAuth?: Record<string, string>;
  clientId: () => string | undefined;
  clientSecret: () => string | undefined;
  profile: (tokens: { access_token?: string; id_token?: string }) => Promise<SocialProfile>;
}

/** Decode a JWT payload WITHOUT signature verification — only ever used on id_tokens received
 *  directly from the provider's token endpoint over TLS, where the transport is the trust. */
function idTokenClaims(idToken: string): Record<string, unknown> {
  const payload = idToken.split(".")[1];
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

function splitName(full: string | undefined, fallback: string): { firstName: string; lastName: string } {
  const name = (full || fallback).trim();
  const i = name.indexOf(" ");
  return i === -1 ? { firstName: name, lastName: "" } : { firstName: name.slice(0, i), lastName: name.slice(i + 1) };
}

function oidcProfile(tokens: { id_token?: string }): SocialProfile {
  if (!tokens.id_token) throw new DomainError("Provider returned no id_token", 502, "social_no_id_token");
  const c = idTokenClaims(tokens.id_token) as {
    sub: string; email?: string; name?: string; given_name?: string; family_name?: string; preferred_username?: string;
  };
  const email = c.email ?? (c.preferred_username?.includes("@") ? c.preferred_username : null);
  const names = c.given_name
    ? { firstName: c.given_name, lastName: c.family_name ?? "" }
    : splitName(c.name, email?.split("@")[0] ?? "Learner");
  return { providerUserId: c.sub, email: email ?? null, ...names };
}

/**
 * Social signup/login — Google, Apple, Meta (Facebook — also covers Instagram accounts),
 * LinkedIn, Microsoft. Config-driven: a provider is live iff its env credentials are set,
 * so buttons appear on /login as Bert provisions each console app. First login creates the
 * platform user (learner role, default org); later logins map through SocialIdentity.
 */
@Injectable()
export class SocialAuthService {
  private readonly log = new Logger(SocialAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly providers: Record<string, ProviderDef> = {
    google: {
      label: "Google",
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scope: "openid email profile",
      clientId: () => process.env.GOOGLE_CLIENT_ID,
      clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
      profile: async (t) => oidcProfile(t),
    },
    microsoft: {
      label: "Microsoft",
      authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      scope: "openid email profile",
      clientId: () => process.env.MICROSOFT_CLIENT_ID,
      clientSecret: () => process.env.MICROSOFT_CLIENT_SECRET,
      profile: async (t) => oidcProfile(t),
    },
    linkedin: {
      label: "LinkedIn",
      authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
      scope: "openid profile email",
      clientId: () => process.env.LINKEDIN_CLIENT_ID,
      clientSecret: () => process.env.LINKEDIN_CLIENT_SECRET,
      profile: async (t) => oidcProfile(t),
    },
    facebook: {
      label: "Meta (Facebook)",
      authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
      scope: "email public_profile",
      clientId: () => process.env.FACEBOOK_CLIENT_ID,
      clientSecret: () => process.env.FACEBOOK_CLIENT_SECRET,
      profile: async (t) => {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${encodeURIComponent(t.access_token ?? "")}`,
          { signal: AbortSignal.timeout(10_000) },
        );
        if (!res.ok) throw new DomainError("Meta profile fetch failed", 502, "social_profile_failed");
        const p = (await res.json()) as { id: string; name?: string; email?: string };
        return { providerUserId: p.id, email: p.email ?? null, ...splitName(p.name, p.email?.split("@")[0] ?? "Learner") };
      },
    },
    apple: {
      label: "Apple",
      authorizeUrl: "https://appleid.apple.com/auth/authorize",
      tokenUrl: "https://appleid.apple.com/auth/token",
      scope: "name email",
      // Apple requires form_post whenever name/email scopes are requested.
      extraAuth: { response_mode: "form_post" },
      clientId: () => process.env.APPLE_CLIENT_ID,
      // Apple's "client secret" is a short-lived ES256 JWT signed with the developer key.
      clientSecret: () => {
        const key = process.env.APPLE_PRIVATE_KEY;
        const teamId = process.env.APPLE_TEAM_ID;
        const keyId = process.env.APPLE_KEY_ID;
        const clientId = process.env.APPLE_CLIENT_ID;
        if (!key || !teamId || !keyId || !clientId) return undefined;
        return jwt.sign({}, key.replace(/\\n/g, "\n"), {
          algorithm: "ES256",
          keyid: keyId,
          issuer: teamId,
          audience: "https://appleid.apple.com",
          subject: clientId,
          expiresIn: "5m",
        });
      },
      profile: async (t) => oidcProfile(t),
    },
  };

  /** Instagram has no consumer login API anymore — Meta login covers Instagram accounts. */
  private resolveKey(provider: string): string {
    const key = provider === "instagram" || provider === "meta" ? "facebook" : provider;
    if (!this.providers[key]) throw new DomainError(`Unknown provider "${provider}"`, 400, "unknown_provider");
    return key;
  }

  /** Providers with credentials configured — drives which buttons the login page shows. */
  enabledProviders() {
    return Object.entries(this.providers)
      .filter(([, def]) => !!def.clientId())
      .map(([key, def]) => ({ key, label: def.label }));
  }

  /** Build the provider redirect. `state` is a short-lived signed JWT (no server session). */
  authorizeRedirect(provider: string, redirectPath = "/learner"): string {
    const key = this.resolveKey(provider);
    const def = this.providers[key];
    const clientId = def.clientId();
    if (!clientId) throw new DomainError(`${def.label} sign-in is not configured yet`, 503, "social_not_configured");
    const state = jwt.sign({ p: key, r: redirectPath.startsWith("/") ? redirectPath : "/learner" }, secret(), { expiresIn: "10m" });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri(key),
      response_type: "code",
      scope: def.scope,
      state,
      ...def.extraAuth,
    });
    return `${def.authorizeUrl}?${params.toString()}`;
  }

  /** Handle the provider callback: verify state, exchange the code, find-or-create the user,
   *  and return our session JWT + where to send the browser. */
  async handleCallback(provider: string, code: string, state: string) {
    const key = this.resolveKey(provider);
    const def = this.providers[key];
    let redirectPath = "/learner";
    try {
      const s = jwt.verify(state, secret()) as { p: string; r: string };
      if (s.p !== key) throw new Error("provider mismatch");
      redirectPath = s.r;
    } catch {
      throw new DomainError("Invalid or expired sign-in state — please try again", 400, "social_bad_state");
    }

    const clientSecret = def.clientSecret();
    if (!clientSecret) throw new DomainError(`${def.label} sign-in is not configured yet`, 503, "social_not_configured");

    const tokenRes = await fetch(def.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: def.clientId()!,
        client_secret: clientSecret,
        redirect_uri: redirectUri(key),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!tokenRes.ok) {
      this.log.warn(`${key} token exchange failed: ${tokenRes.status} ${(await tokenRes.text()).slice(0, 200)}`);
      throw new DomainError(`${def.label} sign-in failed — please try again`, 502, "social_token_failed");
    }
    const tokens = (await tokenRes.json()) as { access_token?: string; id_token?: string };
    const profile = await def.profile(tokens);

    const user = await this.findOrCreateUser(key, profile);
    const roles = (
      await this.prisma.db.roleAssignment.findMany({ where: { userId: user.id }, include: { role: true } })
    ).map((ra) => ra.role.key);
    const claims: JwtClaims = {
      sub: user.id,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      roles: roles.length ? roles : ["learner"],
      name: `${user.firstName} ${user.lastName}`.trim(),
    };
    return { token: jwt.sign(claims, secret(), { expiresIn: "12h" }), redirectPath };
  }

  private async findOrCreateUser(provider: string, p: SocialProfile) {
    const identity = await this.prisma.db.socialIdentity.findUnique({
      where: { provider_providerUserId: { provider, providerUserId: p.providerUserId } },
    });
    if (identity) {
      const user = await this.prisma.db.user.findFirst({ where: { id: identity.userId } });
      if (user) return user;
    }

    // Same-email account linking: a social login for an existing (e.g. password) user attaches
    // rather than duplicating.
    if (p.email) {
      const existing = await this.prisma.db.user.findFirst({ where: { email: p.email } });
      if (existing) {
        await this.prisma.db.socialIdentity.create({
          data: { userId: existing.id, provider, providerUserId: p.providerUserId, email: p.email },
        }).catch(() => undefined);
        return existing;
      }
    }

    // Signup: new learner in the default tenant/org.
    const tenant = await this.prisma.db.tenant.findFirst({ orderBy: { createdAt: "asc" } });
    const org = tenant
      ? await this.prisma.db.organization.findFirst({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" } })
      : null;
    if (!tenant || !org) throw new DomainError("Platform has no tenant to sign up into", 500, "no_tenant");

    const user = await this.prisma.db.user.create({
      data: {
        tenantId: tenant.id,
        organizationId: org.id,
        email: p.email ?? `${provider}-${p.providerUserId}@social.local`,
        firstName: p.firstName || "New",
        lastName: p.lastName || "Learner",
        status: "active",
      },
    });
    let learnerRole = await this.prisma.db.role.findFirst({ where: { tenantId: tenant.id, key: "learner" } });
    if (!learnerRole) {
      learnerRole = await this.prisma.db.role.create({
        data: { tenantId: tenant.id, organizationId: org.id, key: "learner", name: "Learner", permissions: [] },
      });
    }
    await this.prisma.db.roleAssignment.create({ data: { userId: user.id, roleId: learnerRole.id } }).catch(() => undefined);
    await this.prisma.db.socialIdentity.create({
      data: { userId: user.id, provider, providerUserId: p.providerUserId, email: p.email },
    });
    await this.prisma.db.activityEvent
      .create({ data: { tenantId: tenant.id, userId: user.id, kind: "login", refId: provider } })
      .catch(() => undefined);
    this.log.log(`social signup: ${provider} -> ${user.email}`);
    return user;
  }
}
