import type { Metadata } from "next";
import type { ReactNode } from "react";

// signup/page.tsx is a client component ("use client"), so metadata can't be exported from it
// directly — this sibling layout is the standard Next.js way to attach page metadata in that case.
export const metadata: Metadata = {
  title: "Sign Up — Riyada Intelligence",
  description: "Create a free Riyada Intelligence learner account and start a course in under a minute.",
};

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
