"use client";

import { courseGlyph } from "@/components/ui";

/** Course detail hero image — hides itself on load failure instead of showing a broken-image
 *  icon. A client component because the onError handler can't cross the server/client boundary
 *  when rendered from a Server Component page. */
export function CourseHeroImage({ src, title, className = "" }: { src: string; title: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      loading="lazy"
      className={className}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

/**
 * Course thumbnail with a graceful fallback: renders the provider's real image when present,
 * and falls back to the existing wireframe glyph (courseGlyph) when there's no imageUrl yet or
 * the image fails to load — never a broken-image icon. `onError` swaps in the fallback client-
 * side since a provider's CDN link can go stale independent of our own data.
 */
export function CourseThumb({
  title,
  skills = [],
  imageUrl,
  size = "md",
  className = "",
}: {
  title: string;
  skills?: string[];
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = size === "sm" ? "h-10 w-10 text-lg" : size === "lg" ? "h-16 w-16 text-2xl" : "h-12 w-12 text-xl";
  if (!imageUrl) {
    return (
      <span className={`glyph flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-bg ring-1 ring-border ${dims} ${className}`}>
        {courseGlyph(`${title} ${skills.join(" ")}`)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={title}
      loading="lazy"
      className={`shrink-0 rounded-xl object-cover ring-1 ring-border ${dims} ${className}`}
      onError={(e) => {
        // Swap to the glyph fallback in place rather than showing a broken-image icon.
        const el = e.currentTarget;
        const fallback = document.createElement("span");
        fallback.className = `glyph flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-bg ring-1 ring-border ${dims} ${className}`;
        fallback.textContent = courseGlyph(`${title} ${skills.join(" ")}`);
        el.replaceWith(fallback);
      }}
    />
  );
}
