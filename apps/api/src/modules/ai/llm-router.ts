/**
 * Provider-neutral LLM router. The platform never calls a vendor SDK directly — it calls
 * `route()`, which picks a provider+model by task class and per-tenant policy/data-residency,
 * then delegates to the matching adapter. Anthropic (Claude) is the default reasoning model;
 * OpenAI, Gemini, and local models are declared adapters wired the same way.
 *
 * Why a router: cost/latency/quality routing (cheap model for tagging, strong model for
 * coaching), and sovereign-tenant requirements (force local/on-prem inference) without changing
 * any caller. See docs/02-intelligence-engines.md §14.
 */

export type TaskClass =
  | "reasoning" // coaching, planning, complex generation -> strongest model
  | "fast" // classification, tagging, short extraction -> cheap/fast model
  | "local"; // sovereign tenants requiring on-prem inference

export interface LlmTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmRequest {
  system?: string;
  messages: LlmMessage[];
  tools?: LlmTool[];
  maxTokens?: number;
}

export interface LlmToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface LlmResponse {
  text: string;
  toolCalls: LlmToolCall[];
  model: string;
}

export interface LlmProvider {
  readonly key: string; // anthropic | openai | gemini | local
  complete(req: LlmRequest): Promise<LlmResponse>;
}

export interface TenantLlmPolicy {
  /** Force on-prem/local inference (gov/sovereign). */
  requireLocal?: boolean;
  /** Override the provider for a task class. */
  overrides?: Partial<Record<TaskClass, string>>;
}

const DEFAULTS: Record<TaskClass, string> = {
  reasoning: "anthropic", // Claude (claude-opus-4-8) — default reasoning model
  fast: "anthropic", // could route to a cheaper model/provider per cost policy
  local: "local",
};

export class LlmRouter {
  private readonly providers = new Map<string, LlmProvider>();

  register(provider: LlmProvider) {
    this.providers.set(provider.key, provider);
  }

  resolveProviderKey(task: TaskClass, policy: TenantLlmPolicy = {}): string {
    if (policy.requireLocal) return "local";
    if (policy.overrides?.[task]) return policy.overrides[task]!;
    // AI_DEFAULT_PROVIDER lets ops point reasoning/fast at any registered provider (e.g. the
    // Excis gateway via "local") without code changes. Defaults to Claude.
    const envDefault = process.env.AI_DEFAULT_PROVIDER;
    if (envDefault && task !== "local") return envDefault;
    return DEFAULTS[task];
  }

  route(task: TaskClass, req: LlmRequest, policy: TenantLlmPolicy = {}): Promise<LlmResponse> {
    const key = this.resolveProviderKey(task, policy);
    const provider = this.providers.get(key);
    if (!provider) throw new Error(`No LLM provider registered for "${key}"`);
    return provider.complete(req);
  }
}
