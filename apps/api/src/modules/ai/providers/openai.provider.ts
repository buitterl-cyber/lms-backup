/**
 * OpenAI adapter for the LLM router. Implements the same LlmProvider contract as the Anthropic
 * adapter via the Chat Completions HTTP API (no SDK dependency). Registered for tenants whose
 * model policy routes a task class to "openai".
 */
import type { LlmProvider, LlmRequest, LlmResponse, LlmToolCall } from "../llm-router";

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export class OpenAiProvider implements LlmProvider {
  readonly key = "openai";
  constructor(
    private readonly apiKey = process.env.OPENAI_API_KEY,
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-4o",
  ) {}

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const messages = [
      ...(req.system ? [{ role: "system", content: req.system }] : []),
      ...req.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    const body = {
      model: this.model,
      max_tokens: req.maxTokens ?? 4096,
      messages,
      tools: req.tools?.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.inputSchema },
      })),
    };
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const json = (await res.json()) as any;
    const choice = json.choices?.[0]?.message ?? {};
    const toolCalls: LlmToolCall[] = (choice.tool_calls ?? []).map((c: any) => ({
      name: c.function.name,
      input: safeParse(c.function.arguments),
    }));
    return { text: choice.content ?? "", toolCalls, model: json.model ?? this.model };
  }
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
