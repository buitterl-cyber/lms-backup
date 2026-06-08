/**
 * Google Gemini adapter for the LLM router (generateContent HTTP API, no SDK dependency).
 */
import type { LlmProvider, LlmRequest, LlmResponse, LlmToolCall } from "../llm-router";

export class GeminiProvider implements LlmProvider {
  readonly key = "gemini";
  constructor(
    private readonly apiKey = process.env.GEMINI_API_KEY,
    private readonly model = process.env.GEMINI_MODEL ?? "gemini-1.5-pro",
  ) {}

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      systemInstruction: req.system ? { parts: [{ text: req.system }] } : undefined,
      contents: req.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      tools: req.tools?.length
        ? [{ functionDeclarations: req.tools.map((t) => ({ name: t.name, description: t.description, parameters: t.inputSchema })) }]
        : undefined,
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const json = (await res.json()) as any;
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    let text = "";
    const toolCalls: LlmToolCall[] = [];
    for (const p of parts) {
      if (p.text) text += p.text;
      if (p.functionCall) toolCalls.push({ name: p.functionCall.name, input: p.functionCall.args ?? {} });
    }
    return { text, toolCalls, model: this.model };
  }
}
