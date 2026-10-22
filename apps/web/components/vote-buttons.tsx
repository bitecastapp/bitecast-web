"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { Vote } from "@/lib/ratings";
import { applyVote, leadingSide, type VoteState } from "@/lib/votes";
import { cn } from "@/lib/utils";
import { castVote } from "@/app/rating-actions";
import { AgreeIcon, DisagreeIcon } from "@/components/food-icons";
import { AGREE_CRUMBS, DISAGREE_CRUMBS, burst } from "@/lib/burst";

type Props = {
  ratingId: string;
  facts: number; // stored as "facts", shown as Agree
  cap: number; // stored as "cap", shown as Disagree
  mine?: Vote;
  /** Signed out → each side links to sign-in; own take → counts only, no buttons. */
  mode: "vote" | "signed-out" | "own";
};

const SIDES = [
  { kind: "facts" as const, label: "Agree", Icon: AgreeIcon, fill: "bg-mustard", origin: "origin-left", crumbs: AGREE_CRUMBS },
  { kind: "cap" as const, label: "Disagree", Icon: DisagreeIcon, fill: "bg-ketchup", origin: "origin-right", crumbs: DISAGREE_CRUMBS },
];

// Agree | Disagree as one joined control, plus a quiet line for the winning side ("95% agree", "67% disagree").
// Each side is an icon and a count; with a mouse, hovering slides the word out. Picking a side fills that half
// from its outer edge, pops a few crumbs, rolls the count and slides the bar to the new share.
export function VoteButtons({ ratingId, facts, cap, mine, mode }: Props) {
  const [, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic<VoteState>({ facts, cap, mine });
  const fx = useRef<HTMLSpanElement>(null);
  const lead = leadingSide(state.facts, state.cap);

  function press(kind: Vote, button: HTMLElement, crumbs: string[]) {
    const next = applyVote(state, kind);
    if (next.mine) burst(fx.current, button, crumbs); // a new vote, not a cleared one
    startTransition(async () => {
      setOptimistic(next);
      await castVote(ratingId, next.mine ?? null);
    });
  }

  return (
    <div className="relative z-10 flex flex-col items-start gap-2">
      <div role="group" aria-label="Do you agree with this take?" className="inline-flex h-9 overflow-hidden rounded-full border border-hairline bg-raised/60">
        {SIDES.map(({ kind, label, Icon, fill, origin, crumbs }, i) => {
          const active = state.mine === kind;
          const count = kind === "facts" ? state.facts : state.cap;
          const content = (
            <>
              <span
                aria-hidden
                className={cn("absolute inset-0 transition-transform duration-200 ease-[var(--ease-out)]", fill, origin, active ? "scale-x-100" : "scale-x-0")}
              />
              <Icon className={cn("relative size-[18px] shrink-0 transition-transform duration-200 ease-[var(--ease-out)]", active && "scale-110")} />
              {/* The word: collapsed to nothing, it slides open on hover (mouse) or keyboard focus. */}
              <span
                aria-hidden
                className="relative grid grid-cols-[0fr] transition-[grid-template-columns] duration-200 ease-[var(--ease-out)] group-focus-visible/side:grid-cols-[1fr] [@media(hover:hover)_and_(pointer:fine)]:group-hover/side:grid-cols-[1fr]"
              >
                <span className="overflow-hidden whitespace-nowrap">
                  <span className="pl-1.5">{label}</span>
                </span>
              </span>
              <RollingCount value={count} className={cn("relative ml-1.5", active ? "text-studio" : "text-faint")} />
            </>
          );
          const side = cn(
            "group/side relative inline-flex items-center px-3 text-[0.8125rem] font-semibold tabular-nums transition-colors duration-200",
            i === 1 && "border-l border-hairline",
            active ? "text-studio" : "text-muted-foreground",
          );
          if (mode === "vote")
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={active}
                aria-label={`${label}, ${count}`}
                onClick={(e) => press(kind, e.currentTarget, crumbs)}
                className={cn(
                  side,
                  "outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:brightness-90 [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground",
                  active && "[@media(hover:hover)_and_(pointer:fine)]:hover:text-studio",
                )}
              >
                {content}
              </button>
            );
          if (mode === "signed-out")
            return (
              <Link key={kind} href="/login" aria-label={`${label}, ${count}. Sign in to vote`} className={cn(side, "hover:text-foreground")}>
                {content}
              </Link>
            );
          return (
            <span key={kind} aria-label={`${label}, ${count}`} className={side}>
              {content}
            </span>
          );
        })}
      </div>

      {lead && (
        <span className="inline-flex items-center gap-2 text-xs text-faint tabular-nums">
          <span aria-hidden className="relative h-1 w-10 overflow-hidden rounded-full bg-hairline">
            <span
              className={cn(
                "absolute inset-0 origin-left rounded-full transition-[transform,background-color] duration-300 ease-[var(--ease-out)]",
                lead.side === "agree" ? "bg-mustard/80" : "bg-ketchup/80",
              )}
              style={{ transform: `scaleX(${lead.percent / 100})` }}
            />
          </span>
          {lead.percent}% {lead.side}
        </span>
      )}
      {/* Crumbs from burst() are drawn here, outside the pill's overflow clip. */}
      <span ref={fx} aria-hidden className="pointer-events-none absolute inset-0" />
    </div>
  );
}

// The number slides up when it grows and down when it shrinks.
export function RollingCount({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState<{ value: number; dir: "up" | "down" | null }>({ value, dir: null });
  if (value !== shown.value) setShown({ value, dir: value > shown.value ? "up" : "down" });
  return (
    <span className={cn("inline-flex overflow-hidden", className)}>
      <span
        key={value}
        className={cn(shown.dir === "up" && "animate-[roll-up_180ms_var(--ease-out)]", shown.dir === "down" && "animate-[roll-down_180ms_var(--ease-out)]")}
      >
        {value}
      </span>
    </span>
  );
}
