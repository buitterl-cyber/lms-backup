"use client";

import { useState } from "react";

/** Compact demo-request form for the marketing CTA — same public sales inquiry API as InquiryForm. */
export function BookDemoForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/v1/sales/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          message: form.message || "Book a demo — homepage request.",
        }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-lg border border-green/30 bg-green/10 px-4 py-5 text-sm">
        <p className="font-medium text-green">Thanks — we&apos;ll be in touch shortly.</p>
        <p className="mt-1 text-muted">One of our team will follow up to schedule a demo.</p>
      </div>
    );
  }

  const input =
    "min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg outline-none transition focus:border-brand";

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-muted">
          Full name
          <input
            required
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`mt-1 ${input}`}
          />
        </label>
        <label className="block text-xs font-medium text-muted">
          Work email
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={`mt-1 ${input}`}
          />
        </label>
      </div>
      <label className="block text-xs font-medium text-muted">
        Company
        <input
          required
          name="company"
          autoComplete="organization"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className={`mt-1 ${input}`}
        />
      </label>
      <label className="block text-xs font-medium text-muted">
        Anything we should know? <span className="font-normal">(optional)</span>
        <textarea
          name="message"
          rows={3}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`mt-1 ${input} min-h-[5.5rem] resize-y`}
        />
      </label>
      {state === "error" && (
        <p className="text-sm text-red" role="alert">
          Something went wrong — please try again.
        </p>
      )}
      <button
        type="submit"
        disabled={state === "busy"}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accentTeal px-5 text-sm font-semibold text-accentTealInk transition hover:opacity-95 disabled:opacity-60 sm:w-auto"
      >
        {state === "busy" ? "Sending…" : "Book a demo"}
      </button>
    </form>
  );
}
