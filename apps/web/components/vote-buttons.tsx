"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowBigDownIcon, ArrowBigUpIcon } from "lucide-react";
import type { Vote } from "@/lib/ratings";
import { cn } from "@/lib/utils";
import { castVote } from "@/app/rating-actions";

type Props = {
  ratingId: string;
  facts: number;
  cap: number;
  mine?: Vote;
  /** Signed out → links to sign-in; own take → counts only. */
  mode: "vote" | "signed-out" | "own";
};

// Facts (agree) / Cap (disagree). Choosing one "broadcasts": arcs ripple off the arrow and the count rolls.
export function VoteButtons({ ratingId, facts, cap, mine, mode }: Props) {
  const [, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic({ facts, cap, mine });
  const [pulse, setPulse] = useState(0); // bumps on every press so the arcs replay

  function press(kind: Vote) {
    const next = state.mine === kind ? undefined : kind;
    setPulse((p) => p + 1);
    startTransition(async () => {
      setOptimistic({
        facts: state.facts - (state.mine === "facts" ? 1 : 0) + (next === "facts" ? 1 : 0),
        cap: state.cap - (state.mine === "cap" ? 1 : 0) + (next === "cap" ? 1 : 0),
        mine: next,
      });
      await castVote(ratingId, next ?? null);
    });
  }

  const items = [
    { kind: "facts" as const, label: "Facts", count: state.facts, Icon: ArrowBigUpIcon, on: "text-mustard" },
    { kind: "cap" as const, label: "Cap", count: state.cap, Icon: ArrowBigDownIcon, on: "text-ketchup" },
  ];
  const base = "-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground tabular-nums";

  return (
    <div className="relative z-10 flex gap-3">
      {items.map(({ kind, label, count, Icon, on }) => {
        const active = state.mine === kind;
        const inner = (
          <>
            <span className="relative grid place-items-center">
              {active && mode === "vote" && <Arcs key={pulse} up={kind === "facts"} />}
              <Icon
                aria-hidden
                className={cn(
                  "size-5 transition-transform duration-150 ease-[var(--ease-out)] group-active:scale-[0.85]",
                  active && "fill-current",
                )}
              />
            </span>
            <span className={cn(active && "font-semibold")}>{label}</span>
            <RollingCount value={count} />
          </>
        );
        if (mode === "vote")
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={active}
              onClick={() => press(kind)}
              className={cn(
                base,
                "group transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [@media(hover:hover)_and_(pointer:fine)]:hover:bg-raised [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground",
                active && on,
              )}
            >
              {inner}
            </button>
          );
        if (mode === "signed-out")
          return (
            <Link key={kind} href="/login" aria-label={`${label} ${count}. Sign in to vote`} className={cn(base, "hover:text-foreground")}>
              {inner}
            </Link>
          );
        return (
          <span key={kind} className={base}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}

// Two broadcast arcs over (Facts) or under (Cap) the arrow, played once per press.
function Arcs({ up }: { up: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={cn("pointer-events-none absolute size-10", !up && "rotate-180")}>
      {["M12 16a11 11 0 0 1 16 0", "M7 11a18 18 0 0 1 26 0"].map((d, i) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          className="origin-[20px_20px] animate-[broadcast_480ms_var(--ease-out)_both]"
          style={{ animationDelay: `${i * 70}ms` }}
        />
      ))}
    </svg>
  );
}

// The number slides up when it grows and down when it shrinks.
function RollingCount({ value }: { value: number }) {
  const [shown, setShown] = useState<{ value: number; dir: "up" | "down" | null }>({ value, dir: null });
  if (value !== shown.value) setShown({ value, dir: value > shown.value ? "up" : "down" });
  const dir = shown.dir;
  return (
    <span className="inline-flex overflow-hidden">
      <span key={value} className={cn(dir === "up" && "animate-[roll-up_180ms_var(--ease-out)]", dir === "down" && "animate-[roll-down_180ms_var(--ease-out)]")}>
        {value}
      </span>
    </span>
  );
}
