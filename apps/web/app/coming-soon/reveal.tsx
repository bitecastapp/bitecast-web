"use client";

import { useEffect } from "react";

// Section entrances: each [data-reveal] part rises in once as it scrolls into view, staggered by its --i.
// Content stays visible without this script: the hiding style only applies once it has run.
export function Reveal() {
  useEffect(() => {
    const parts = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-in", "");
          io.unobserve(e.target);
        }
      },
      // A share of the element, not a margin: a margin would never reveal the last line of the page, which can't scroll up into it.
      { threshold: 0.15 },
    );
    parts.forEach((p) => io.observe(p));
    document.documentElement.classList.add("reveal-ready");
    return () => io.disconnect();
  }, []);
  return null;
}
