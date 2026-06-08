/**
 * Local / gateway model adapter for the LLM router. Targets any OpenAI-style endpoint via
 * LOCAL_LLM_BASE_URL with an optional bearer key (LOCAL_LLM_API_KEY) — used here for Excis's
 * internal Ollama gateway (api.excis.ai), and equally for on-prem inference in sovereign tenants.
 *
 * Handles BOTH response shapes: OpenAI (`choices[0].message`) and Ollama-native (`message`),
 * since the Excis gateway returns the latter.
 */
import type { LlmProvider, LlmRequest, LlmResponse, LlmToolCall } from "../llm-router";

export class LocalProvider implements LlmProvider {
  readonly key = "local";
  constructor(
    private readonly baseUrl = process.env.LOCAL_LLM_BASE_URL ?? "http://localhost:11434/v1",
    private readonly model = process.env.LOCAL_LLM_MODEL ?? "llama3.1",
    private readonly apiKey = process.env.LOCAL_LLM_API_KEY,
  ) {}

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const messages = [
      ...(req.system ? [{ role: "system", content: req.system }] : []),
      ...req.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        max_tokens: req.maxTokens ?? 4096,
        ...(req.tools?.length
          ? { tools: req.tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.inputSchema } })) }
          : {}),
      }),
    });
    if (!res.ok) throw new Error(`Local LLM ${res.status}: ${(await res.text()).slice(0, 200)}`);

    const json = (await res.json()) as any;
    const msg = json.choices?.[0]?.message ?? json.message ?? {}; // OpenAI vs Ollama shape
    const text: string = msg.content ?? "";
    const toolCalls: LlmToolCall[] = (msg.tool_calls ?? []).map((c: any) => {
      const fn = c.function ?? c;
      const args = fn.arguments;
      return { name: fn.name, input: typeof args === "string" ? safeParse(args) : (args ?? {}) };
    });
    return { text, toolCalls, model: json.model ?? this.model };
  }
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
