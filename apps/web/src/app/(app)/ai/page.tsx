"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { apiPost, getContext, type DemoContext } from "@/lib/api";

// RIYADA AI surface. Sends the prompt to the grounded assistant; renders the answer plus the
// tools it called (grounding), because explainability is a product requirement.
interface ChatResult {
  answer: string;
  grounding: { tool: string; result: unknown }[];
}

const SUGGESTIONS = [
  "What skills am I missing for Cloud Security Engineer?",
  "What's my department's compliance risk?",
  "What training should I take next, and why?",
];

export default function AiPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChatResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<DemoContext | null>(null);

  useEffect(() => {
    getContext().then(setCtx).catch(() => setCtx(null));
  }, []);

  async function ask(q: string) {
    if (!ctx) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await apiPost<ChatResult>("/ai/chat", ctx, { prompt: q }));
    } catch {
      setError("RIYADA AI needs ANTHROPIC_API_KEY set on the API to return grounded answers (the rest of the platform is live).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">RIYADA AI</h1>
        <p className="text-sm text-muted">Grounded in your Skills Graph, compliance state, and recommendations.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => { setPrompt(s); void ask(s); }} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-fg">
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (prompt.trim()) void ask(prompt); }}
        className="flex gap-2"
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about skills, compliance, certifications, or your career…"
          className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button disabled={loading} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      {error && <Card className="text-sm text-amber">{error}</Card>}

      {result && (
        <div className="space-y-4">
          <Card>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.answer}</p>
          </Card>
          {result.grounding.length > 0 && (
            <Card>
              <p className="mb-2 text-xs font-medium text-muted">Grounded in {result.grounding.length} tool call(s)</p>
              <ul className="space-y-1 text-xs text-muted">
                {result.grounding.map((g, i) => (
                  <li key={i} className="font-mono">{g.tool}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
