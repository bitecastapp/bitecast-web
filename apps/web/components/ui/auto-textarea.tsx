"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"textarea"> & { maxRows?: number };

// A text box that grows with what you type (no drag-to-resize handle), up to `maxRows`, then scrolls inside.
export function AutoTextarea({ className, maxRows = 8, onInput, ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function fit() {
    const el = ref.current;
    // Hidden (e.g. inside a closed dialog) it measures 0 tall; size it once it's visible and typed in instead.
    if (!el || el.offsetParent === null) return;
    const style = getComputedStyle(el);
    const line = parseFloat(style.lineHeight) || 24;
    const chrome = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const max = line * maxRows + chrome;
    el.style.height = "auto";
    const wanted = el.scrollHeight + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    el.style.height = `${Math.min(wanted, max)}px`;
    el.style.overflowY = wanted > max ? "auto" : "hidden";
  }

  // Controlled boxes (value from state) refit when the value changes, e.g. cleared after posting.
  useLayoutEffect(fit, [props.value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <textarea
      {...props}
      ref={ref}
      onInput={(e) => {
        fit();
        onInput?.(e);
      }}
      className={cn("resize-none", className)}
    />
  );
}
