/**
 * Generic OAuth2 "client credentials" token fetcher, shared by any connector that authenticates
 * as itself (not on behalf of a user) — the flow GO1's and most content-aggregator APIs use.
 *
 * This is intentionally provider-agnostic: it knows nothing about GO1's actual token endpoint,
 * request shape, or response fields, because we don't have GO1's API docs yet (waiting on Luke
 * Barnes at GO1). Every field below (`tokenUrl`, `scope`, grant_type body shape, expected
 * `expires_in` response field) follows the RFC 6749 client-credentials convention that nearly
 * every vendor implements verbatim — but GO1 specifically may differ (custom param names, a
 * `portal`/account scoping field, non-standard expiry field, etc.). Confirm against real GO1 docs
 * before relying on this for production traffic.
 *
 * Usage from a provider connector:
 *   const tokens = new ClientCredentialsTokenCache({
 *     tokenUrl: config.options?.tokenUrl as string ?? DEFAULT_TOKEN_URL,
 *     clientId: config.credentials.clientId,
 *     clientSecret: config.credentials.clientSecret,
 *   });
 *   const token = await tokens.getToken();
 *   fetch(url, { headers: { Authorization: `Bearer ${token}` } });
 */

export interface ClientCredentialsConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  /** Space-delimited scope string, if the provider requires one. */
  scope?: string;
  /** Refresh this many seconds before actual expiry, to avoid racing a token that just expired. */
  refreshSkewSeconds?: number;
}

interface RawTokenResponse {
  access_token: string;
  expires_in?: number; // seconds; RFC 6749 default field name
  token_type?: string;
}

/**
 * Fetches + caches a bearer token in memory, refreshing once it's within `refreshSkewSeconds` of
 * expiry. One instance per provider connection (a tenant's credentials), not shared globally.
 */
export class ClientCredentialsTokenCache {
  private cached: { token: string; expiresAt: number } | null = null;

  constructor(private readonly config: ClientCredentialsConfig) {}

  async getToken(): Promise<string> {
    const skewMs = (this.config.refreshSkewSeconds ?? 60) * 1000;
    if (this.cached && this.cached.expiresAt - skewMs > Date.now()) {
      return this.cached.token;
    }
    return this.fetchToken();
  }

  /** Force a fresh token, bypassing the cache (e.g. after a 401 from the resource server). */
  async refresh(): Promise<string> {
    return this.fetchToken();
  }

  private async fetchToken(): Promise<string> {
    // TODO(GO1 docs): confirm whether GO1 expects this as a JSON body, form-encoded body, or
    // HTTP Basic auth header for client_id/client_secret — all three are common across vendors
    // and RFC 6749 technically prefers Basic auth. Form-encoded is the most common fallback.
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      ...(this.config.scope ? { scope: this.config.scope } : {}),
    });

    const res = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      throw new Error(`OAuth client-credentials token request failed: ${res.status} ${await res.text().catch(() => "")}`);
    }
    const data = (await res.json()) as RawTokenResponse;
    const ttlMs = (data.expires_in ?? 3600) * 1000;
    this.cached = { token: data.access_token, expiresAt: Date.now() + ttlMs };
    return this.cached.token;
  }
}
