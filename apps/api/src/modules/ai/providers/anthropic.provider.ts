/**
 * Anthropic (Claude) adapter — the default reasoning model for RIYADA AI.
 *
 * Uses the official @anthropic-ai/sdk and `claude-opus-4-8` with adaptive thinking. Adaptive
 * thinking is the only thinking mode on Opus 4.8 (a fixed `budget_tokens` would 400); `effort`
 * tunes depth. Streaming is used for large outputs to avoid HTTP timeouts; here we take the
 * final message since responses are bounded.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { LlmProvider, LlmRequest, LlmResponse, LlmToolCall } from "../llm-router";

const MODEL = "claude-opus-4-8";

export class AnthropicProvider implements LlmProvider {
  readonly key = "anthropic";
  private readonly client: Anthropic;

  constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: req.maxTokens ?? 4096,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: req.system,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      tools: req.tools?.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
      })),
    });

    let text = "";
    const toolCalls: LlmToolCall[] = [];
    for (const block of message.content) {
      if (block.type === "text") text += block.text;
      else if (block.type === "tool_use") {
        toolCalls.push({ name: block.name, input: block.input as Record<string, unknown> });
      }
    }
    return { text, toolCalls, model: message.model };
  }
}
