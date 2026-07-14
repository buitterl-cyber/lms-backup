import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

// Type system: Sora carries display personality (logo, page titles, big metrics);
// Inter does the quiet UI work. Both variable, both self-hosted by next/font.
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

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
    <html lang="en" dir="ltr" className={`dark ${sora.variable} ${inter.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
