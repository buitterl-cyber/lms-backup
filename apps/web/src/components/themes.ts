/** Skin registry for the picker. CSS owns the real tokens (globals.css [data-theme=…]);
 *  the hexes here only paint the picker swatches. `mode` is the one thing CSS can't infer
 *  on its own — it says whether this skin's `[data-theme=…]` block belongs to the dark or
 *  light family in globals.css, so callers can set the `dark` class explicitly instead of
 *  relying on stylesheet order (see `skinMode` below). */
export interface Skin {
  key: string;
  name: string;
  tag: string;
  bg: string;
  brand: string;
  mode: "light" | "dark";
}

export const SKINS: Skin[] = [
  { key: "riyada", name: "Riyada", tag: "the official look", bg: "#f7f9fd", brand: "#225ec8", mode: "light" },
  { key: "midnight", name: "Midnight", tag: "the classic", bg: "#0b0c12", brand: "#818cf8", mode: "dark" },
  { key: "daylight", name: "Daylight", tag: "clean & bright", bg: "#fafafc", brand: "#4f46e5", mode: "light" },
  { key: "ocean", name: "Ocean", tag: "deep water", bg: "#060e18", brand: "#38aaf0", mode: "dark" },
  { key: "borealis", name: "Borealis", tag: "northern lights", bg: "#060f11", brand: "#2dd4bf", mode: "dark" },
  { key: "forest", name: "Forest", tag: "into the woods", bg: "#080e0a", brand: "#4ac878", mode: "dark" },
  { key: "sunset", name: "Sunset", tag: "golden hour", bg: "#140a0e", brand: "#f47258", mode: "dark" },
  { key: "grape", name: "Grape", tag: "royal purple", bg: "#0f0916", brand: "#b27af6", mode: "dark" },
  { key: "ember", name: "Ember", tag: "warm glow", bg: "#0e0908", brand: "#f06e3c", mode: "dark" },
  { key: "cyber", name: "Cyber", tag: "night city", bg: "#0c0714", brand: "#ec48c8", mode: "dark" },
  { key: "volt", name: "Volt", tag: "high energy", bg: "#080a07", brand: "#a3e635", mode: "dark" },
  { key: "royal", name: "Royal", tag: "navy & gold", bg: "#080c1a", brand: "#deb258", mode: "dark" },
  { key: "espresso", name: "Espresso", tag: "coffee break", bg: "#110c09", brand: "#c88c5a", mode: "dark" },
  { key: "mono", name: "Mono", tag: "no distractions", bg: "#09090a", brand: "#e2e2e6", mode: "dark" },
  { key: "paper", name: "Paper", tag: "easy reading", bg: "#f8f6f1", brand: "#3c5aa6", mode: "light" },
  { key: "sand", name: "Sand", tag: "desert warm", bg: "#f9f4eb", brand: "#c26036", mode: "light" },
  { key: "mint", name: "Mint", tag: "cool & calm", bg: "#f1f9f5", brand: "#168c60", mode: "light" },
  { key: "sky", name: "Sky", tag: "blue skies", bg: "#f1f7fc", brand: "#1676c8", mode: "light" },
  { key: "rose", name: "Rose", tag: "soft & bold", bg: "#fcf4f6", brand: "#c83464", mode: "light" },
  { key: "bubblegum", name: "Bubblegum", tag: "pure fun", bg: "#faf3fc", brand: "#be3cc8", mode: "light" },
  { key: "lagoon", name: "Lagoon", tag: "tropical", bg: "#eef8f8", brand: "#0e8088", mode: "light" },
  { key: "citrus", name: "Citrus", tag: "fresh squeeze", bg: "#fcf9f0", brand: "#be7a0a", mode: "light" },
];

export const THEME_COOKIE = "riyada_theme";

/** The dark/light family for a skin key, defaulting to "dark" (today's implicit default)
 *  for an unrecognized key. Single source of truth for anything that needs to set the
 *  `dark` class explicitly — root layout on first paint, ThemeSwitcher on live switch. */
export function skinMode(key: string | undefined): "light" | "dark" {
  return SKINS.find((s) => s.key === key)?.mode ?? "dark";
}
