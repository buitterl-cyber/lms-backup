"use client";

import { useState } from "react";
import { isValidEmail } from "@/lib/validation";

/** Compact demo-request form for the marketing CTA — same public sales inquiry API as InquiryForm. */
export function BookDemoForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [validationError, setValidationError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");
    if (!form.name.trim() || !form.company.trim()) {
      setValidationError("Please fill in your name and company.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setValidationError("Enter a valid work email address.");
      return;
    }
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
        <p className="mt-1 text-slate-500">One of our team will follow up to schedule a demo.</p>
      </div>
    );
  }

  // Fixed (non-theme-reactive) colors — this form always sits on a hardcoded white card
  // (see page.tsx), so its text must stay legible against white regardless of active skin.
  const input =
    "min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-brand sm:min-h-11 sm:rounded-lg sm:py-2 sm:text-sm";

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-500">
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
        <label className="block text-xs font-medium text-slate-500">
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
      <label className="block text-xs font-medium text-slate-500">
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
      <label className="block text-xs font-medium text-slate-500">
        Anything we should know? <span className="font-normal">(optional)</span>
        <textarea
          name="message"
          rows={3}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`mt-1 ${input} min-h-[5.5rem] resize-y`}
        />
      </label>
      {validationError && (
        <p className="text-sm text-red" role="alert">{validationError}</p>
      )}
      {state === "error" && (
        <p className="text-sm text-red" role="alert">
          Something went wrong — please try again.
        </p>
      )}
      <button
        type="submit"
        disabled={state === "busy"}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accentOrange px-5 text-base font-semibold text-accentOrangeInk transition hover:opacity-95 disabled:opacity-60 sm:min-h-11 sm:w-auto sm:rounded-lg sm:text-sm"
      >
        {state === "busy" ? "Sending…" : "Book a demo"}
      </button>
    </form>
  );
}
