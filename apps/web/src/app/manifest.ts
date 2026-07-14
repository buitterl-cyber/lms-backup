import type { MetadataRoute } from "next";

// PWA manifest — installable on iOS/Android home screens (Carl: mobile-friendly at launch).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RiyadaIntel LMS",
    short_name: "RiyadaIntel",
    description: "AI-powered learning & workforce intelligence platform",
    start_url: "/learner",
    display: "standalone",
    background_color: "#0b0c10",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
