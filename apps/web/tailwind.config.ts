import type { Config } from "tailwindcss";

// Premium, minimal, enterprise palette (Apple/Linear/Stripe-inspired). Dark mode via class.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        brand: "rgb(var(--brand) / <alpha-value>)",
        green: "rgb(16 185 129 / <alpha-value>)",
        amber: "rgb(245 158 11 / <alpha-value>)",
        red: "rgb(239 68 68 / <alpha-value>)",
        brandGold: "rgb(var(--brand-gold) / <alpha-value>)",
        brandGoldInk: "rgb(var(--brand-gold-ink) / <alpha-value>)",
        heroAmber: "rgb(var(--hero-amber) / <alpha-value>)",
        heroTeal: "rgb(var(--hero-teal) / <alpha-value>)",
        heroCoral: "rgb(var(--hero-coral) / <alpha-value>)",
        heroPanel: "rgb(var(--hero-panel) / <alpha-value>)",
        accentTeal: "rgb(var(--accent-teal) / <alpha-value>)",
        accentTealInk: "rgb(var(--accent-teal-ink) / <alpha-value>)",
      },
      borderRadius: { xl: "0.9rem" },
    },
  },
  plugins: [],
};
export default config;
