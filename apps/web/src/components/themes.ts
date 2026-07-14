/** Skin registry for the picker. CSS owns the real tokens (globals.css [data-theme=…]);
 *  the hexes here only paint the picker swatches. */
export interface Skin {
  key: string;
  name: string;
  tag: string;
  bg: string;
  brand: string;
}

export const SKINS: Skin[] = [
  { key: "midnight", name: "Midnight", tag: "the classic", bg: "#0b0c12", brand: "#818cf8" },
  { key: "daylight", name: "Daylight", tag: "clean & bright", bg: "#fafafc", brand: "#4f46e5" },
  { key: "ocean", name: "Ocean", tag: "deep water", bg: "#060e18", brand: "#38aaf0" },
  { key: "borealis", name: "Borealis", tag: "northern lights", bg: "#060f11", brand: "#2dd4bf" },
  { key: "forest", name: "Forest", tag: "into the woods", bg: "#080e0a", brand: "#4ac878" },
  { key: "sunset", name: "Sunset", tag: "golden hour", bg: "#140a0e", brand: "#f47258" },
  { key: "grape", name: "Grape", tag: "royal purple", bg: "#0f0916", brand: "#b27af6" },
  { key: "ember", name: "Ember", tag: "warm glow", bg: "#0e0908", brand: "#f06e3c" },
  { key: "cyber", name: "Cyber", tag: "night city", bg: "#0c0714", brand: "#ec48c8" },
  { key: "volt", name: "Volt", tag: "high energy", bg: "#080a07", brand: "#a3e635" },
  { key: "royal", name: "Royal", tag: "navy & gold", bg: "#080c1a", brand: "#deb258" },
  { key: "espresso", name: "Espresso", tag: "coffee break", bg: "#110c09", brand: "#c88c5a" },
  { key: "mono", name: "Mono", tag: "no distractions", bg: "#09090a", brand: "#e2e2e6" },
  { key: "paper", name: "Paper", tag: "easy reading", bg: "#f8f6f1", brand: "#3c5aa6" },
  { key: "sand", name: "Sand", tag: "desert warm", bg: "#f9f4eb", brand: "#c26036" },
  { key: "mint", name: "Mint", tag: "cool & calm", bg: "#f1f9f5", brand: "#168c60" },
  { key: "sky", name: "Sky", tag: "blue skies", bg: "#f1f7fc", brand: "#1676c8" },
  { key: "rose", name: "Rose", tag: "soft & bold", bg: "#fcf4f6", brand: "#c83464" },
  { key: "bubblegum", name: "Bubblegum", tag: "pure fun", bg: "#faf3fc", brand: "#be3cc8" },
  { key: "lagoon", name: "Lagoon", tag: "tropical", bg: "#eef8f8", brand: "#0e8088" },
  { key: "citrus", name: "Citrus", tag: "fresh squeeze", bg: "#fcf9f0", brand: "#be7a0a" },
];

export const THEME_COOKIE = "riyada_theme";
