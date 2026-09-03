"use client";

import { useLayoutEffect, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/**
 * Portals its children to document.body and positions them with `position: fixed`, anchored to
 * `anchorRef`'s bottom edge. This is the fix for the classic "dropdown renders behind page
 * content" bug: a plain `absolute` dropdown is still confined to whatever stacking context its
 * nearest positioned ancestor happens to sit in, so a parent with a transform/opacity/z-index/
 * sticky-position elsewhere on the page can trap it below sibling content even though the
 * dropdown's own z-index is high. Portaling to <body> makes it a direct child of the root
 * stacking context, so its z-index is compared against the WHOLE page, not just its local
 * subtree — no ancestor can trap it.
 *
 * Pass `panelRef` so the caller's click-outside handler can also treat clicks inside the
 * (now-portaled) panel as "inside" — it's no longer a DOM descendant of the trigger button.
 */
export function DropdownPortal({
  anchorRef,
  panelRef,
  open,
  align = "right",
  gap = 8,
  className = "",
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  panelRef?: RefObject<HTMLDivElement | null>;
  open: boolean;
  align?: "left" | "right";
  gap?: number;
  className?: string;
  children: ReactNode;
}) {
  const [pos, setPos] = useState<{ top: number; left: number | "auto"; right: number | "auto" } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos(
        align === "right"
          ? { top: r.bottom + gap, right: window.innerWidth - r.right, left: "auto" }
          : { top: r.bottom + gap, left: r.left, right: "auto" },
      );
    }
    place();
    // Keep it glued to the trigger — it's no longer in the same DOM subtree, so it won't move
    // with the trigger automatically the way an `absolute` child would.
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, align, gap]);

  if (!open || !pos || typeof document === "undefined") return null;
  return createPortal(
    <div ref={panelRef} className={`fixed z-50 ${className}`} style={{ top: pos.top, left: pos.left, right: pos.right }}>
      {children}
    </div>,
    document.body,
  );
}
