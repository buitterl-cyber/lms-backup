import type { Metadata } from "next";
import type { ReactNode } from "react";

// reset-password/page.tsx is a client component ("use client"), so metadata can't be exported
// from it directly — this sibling layout is the standard Next.js way to attach page metadata.
export const metadata: Metadata = {
  title: "Set New Password — Riyada Intelligence",
  description: "Choose a new password for your Riyada Intelligence account.",
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
