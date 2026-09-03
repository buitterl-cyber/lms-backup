"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Chevron, RiskBadge } from "@/components/ui";
import { apiGet, apiPost, getContext, type DemoContext } from "@/lib/api";

interface Q { id: string; type: string; prompt: string; options: string[] }
interface Assessment { id: string; title: string; passScore: number; questions: Q[] }
interface Result { percent: number | null; passed: boolean | null; scoredPoints: number; totalAutoGradablePoints: number }

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const [ctx, setCtx] = useState<DemoContext | null>(null);
  const [a, setA] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getContext()
      .then(async (c) => {
        setCtx(c);
        setA(await apiGet<Assessment>(`/assessments/${id}`, c));
      })
      .catch(() => {});
  }, [id]);

  function choose(qid: string, opt: string, multi: boolean) {
    setAnswers((prev) => {
      const cur = prev[qid] ?? [];
      if (multi) return { ...prev, [qid]: cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt] };
      return { ...prev, [qid]: [opt] };
    });
  }

  async function submit() {
    if (!ctx || !a) return;
    setBusy(true);
    try {
      setResult(await apiPost<Result>(`/assessments/${a.id}/attempts`, ctx, { responses: answers }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  if (!a) return <Card>Loading assessment…</Card>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link href="/catalog" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <Chevron direction="left" /> Catalog
        </Link>
        <h1 className="font-display mt-1 text-2xl font-semibold">{a.title}</h1>
        <p className="text-sm text-muted">{a.questions.length} questions · pass mark {a.passScore}%</p>
      </header>

      {result && (
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Your score</p>
            <p className="text-3xl font-semibold">{result.percent ?? 0}%</p>
            <p className="text-xs text-muted">{result.scoredPoints}/{result.totalAutoGradablePoints} points</p>
          </div>
          <RiskBadge risk={result.passed ? "green" : "red"} label={result.passed ? "Passed" : "Not passed"} />
        </Card>
      )}

      {a.questions.map((q, i) => {
        const multi = q.type === "multiple";
        return (
          <Card key={q.id}>
            <p className="font-medium">
              {i + 1}. {q.prompt} {multi && <span className="text-xs text-muted">(select all)</span>}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt) => {
                const selected = (answers[q.id] ?? []).includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => choose(q.id, opt, multi)}
                    disabled={!!result}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-start text-sm ${selected ? "border-brand bg-brand/10" : "border-border hover:bg-bg"}`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center ${multi ? "rounded" : "rounded-full"} border ${selected ? "border-brand bg-brand text-white" : "border-muted"}`}>
                      {selected ? "✓" : ""}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}

      {!result ? (
        <Button onClick={submit} disabled={busy} size="lg" className="w-full">
          {busy ? "Grading…" : "Submit assessment"}
        </Button>
      ) : (
        <Button href="/learner" variant="secondary" size="lg" className="w-full">
          Back to dashboard
        </Button>
      )}
    </div>
  );
}
