import type { Metadata } from "next";
import type { ReactNode } from "react";

// forgot-password/page.tsx is a client component ("use client"), so metadata can't be exported
// from it directly — this sibling layout is the standard Next.js way to attach page metadata.
export const metadata: Metadata = {
  title: "Reset Password — Riyada Intelligence",
  description: "Request a password reset link for your Riyada Intelligence account.",
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
