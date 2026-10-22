"use client";

import { useOptimistic, useRef, useTransition } from "react";
import Link from "next/link";
import { BookmarkCheckIcon, BookmarkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { setSaved } from "@/app/u/[handle]/actions";
import { AGREE_CRUMBS, burst } from "@/lib/burst";
import { toast } from "@/components/toaster";

type Props = { dishId: string; saved: boolean; signedIn: boolean; compact?: boolean; className?: string };

// "Want to try": save a dish for later. Signed out, it leads to sign-in.
// `compact` is the bookmark-only version for a post's action row, next to the votes.
export function SaveButton({ dishId, saved, signedIn, compact, className }: Props) {
  const [, startTransition] = useTransition();
  const [on, setOn] = useOptimistic(saved);
  const fx = useRef<HTMLSpanElement>(null);
  const label = on ? "On your list" : "Want to try";
  const cls = cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
    compact
      ? cn("relative z-10 size-9 rounded-full", on ? "text-mustard" : "text-muted-foreground hover:text-foreground")
      : cn(
          "min-h-11 rounded-md border px-4 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          on ? "border-mustard/60 bg-mustard/10 text-mustard" : "border-hairline text-foreground hover:bg-muted",
        ),
    className,
  );
  const icon = compact ? "size-[18px]" : "size-4";
  const content = (
    <>
      {on ? (
        <BookmarkCheckIcon aria-hidden className={cn(icon, "animate-[check-pop_420ms_var(--ease-out)_both] fill-mustard/25")} />
      ) : (
        <BookmarkIcon aria-hidden className={icon} />
      )}
      {!compact && label}
    </>
  );
  const named = compact ? { "aria-label": signedIn ? "Want to try" : "Want to try. Sign in to save it", title: label } : {};

  if (!signedIn)
    return (
      <Link href="/login" className={cls} {...named}>
        {content}
      </Link>
    );
  // Saving pops the bookmark, throws a few crumbs and confirms with a toast; removing just confirms.
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-pressed={on}
        {...named}
        onClick={(e) => {
          if (!on) burst(fx.current, e.currentTarget, AGREE_CRUMBS);
          startTransition(async () => {
            setOn(!on);
            await setSaved(dishId, !on);
            toast(on ? "Removed from Want to try" : "Added to Want to try");
          });
        }}
        className={cls}
      >
        {content}
      </button>
      <span ref={fx} aria-hidden className="pointer-events-none absolute inset-0" />
    </span>
  );
}
