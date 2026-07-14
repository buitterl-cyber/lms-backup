import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiyadaIntel — AI-Powered Workforce Intelligence Platform",
  description:
    "Connect skills, compliance, certifications, careers and learning from every major training provider into a single intelligence layer.",
  appleWebApp: { capable: true, title: "RiyadaIntel", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Shell only. The marketing landing + login render full-bleed; the app shell (sidebar) lives in
  // the (app) route group's layout.
  return (
    <html lang="en" dir="ltr" className="dark">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
