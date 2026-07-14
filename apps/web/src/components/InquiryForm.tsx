"use client";

import { useState } from "react";

/** Public sales inquiry — posts straight to the public API; a submit becomes a CRM deal and
 *  emails sales immediately. */
export function InquiryForm({ courseId, courseTitle }: { courseId?: string; courseTitle?: string }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", message: courseTitle ? `I'd like to know more about "${courseTitle}".` : "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
      <div className="rounded-xl border border-green/40 bg-green/10 p-4 text-sm">
        <p className="font-medium text-green">Thanks — we&apos;ve got it! ✓</p>
        <p className="mt-1 text-muted">Our team will be in touch shortly.</p>
      </div>
    );

  const input = "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand";
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
        <input required type="email" placeholder="Work email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
        <input placeholder="Company (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={input} />
        <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
      </div>
      <textarea required rows={3} placeholder="What are you looking to achieve?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={input} />
      <button type="submit" disabled={state === "busy"} className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:w-auto">
        {state === "busy" ? "Sending…" : state === "error" ? "Something went wrong — retry" : "Talk to our team →"}
      </button>
    </form>
  );
}
