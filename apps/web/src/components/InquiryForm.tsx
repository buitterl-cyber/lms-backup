"use client";

import { useState } from "react";
import { Button, Card, Chevron } from "@/components/ui";
import { isValidEmail } from "@/lib/validation";

/** Public sales inquiry — posts straight to the public API; a submit becomes a CRM deal and
 *  emails sales immediately. */
export function InquiryForm({ courseId, courseTitle }: { courseId?: string; courseTitle?: string }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", message: courseTitle ? `I'd like to know more about "${courseTitle}".` : "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [validationError, setValidationError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");
    if (!form.name.trim() || !form.message.trim()) {
      setValidationError("Please fill in your name and what you're looking to achieve.");
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
        body: JSON.stringify({ ...form, courseId }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done")
    return (
      <Card tone="green" padding="md" className="text-sm">
        <p className="font-medium text-green">Thanks — we&apos;ve got it! ✓</p>
        <p className="mt-1 text-muted">Our team will be in touch shortly.</p>
      </Card>
    );

  const input = "min-h-12 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-base outline-none focus:border-brand sm:min-h-10 sm:rounded-lg sm:py-2 sm:text-sm";
  return (
    <form onSubmit={submit} className="space-y-2.5" noValidate>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-2">
        <input required placeholder="Your name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
        <input required type="email" placeholder="Work email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
        <input placeholder="Company (optional)" autoComplete="organization" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={input} />
        <input placeholder="Phone (optional)" autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
      </div>
      <textarea required rows={3} placeholder="What are you looking to achieve?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${input} min-h-[5.5rem] resize-y`} />
      {validationError && <p className="text-xs text-red" role="alert">{validationError}</p>}
      <Button type="submit" disabled={state === "busy"} className="min-h-12 w-full text-base sm:min-h-10 sm:w-auto sm:text-sm">
        {state === "busy" ? "Sending…" : state === "error" ? "Something went wrong — retry" : <>Talk to our team <Chevron className="ms-1" /></>}
      </Button>
    </form>
  );
}
