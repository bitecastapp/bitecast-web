"use client";

import { useState } from "react";
import { formatScore, scoreColor, verdict } from "@/lib/ratings";
import { cn } from "@/lib/utils";

const STEPS = Array.from({ length: 19 }, (_, i) => 1 + i / 2); // 1, 1.5 … 10

// The score as a signal meter: 19 rising bars (half steps) that light up ketchup-to-mustard as you go.
// A transparent range input covers the bars, so tapping, dragging and arrow keys all pick a score.
export function ScoreMeter({ score, onChange }: { score: number; onChange: (n: number) => void }) {
  const [from, setFrom] = useState(score);
  // Mouse: the bars follow the cursor as a preview until you click; the click commits and locks them until the cursor
  // leaves, so a stray drag can't change your score. Touch: drag across the bars or lift to pick; a vertical swipe is
  // a page scroll (the browser cancels the touch) and picks nothing. Keyboard: the slider below.
  const [hover, setHover] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [dragging, setDragging] = useState(false);
  const shown = hover ?? score;
  const pick = (n: number) => {
    if (n === score) return;
    setFrom(score);
    onChange(n);
  };
  const valueAt = (e: React.PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const at = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    return 1 + Math.round(at * 18) / 2; // same 1–10 half-step mapping as the slider underneath
  };
  const onDown = (e: React.PointerEvent<HTMLElement>) => {
    setHover(null);
    if (e.pointerType === "mouse") {
      pick(valueAt(e));
      setLocked(true);
    } else {
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse") {
      if (!locked) setHover(valueAt(e));
    } else if (dragging) pick(valueAt(e));
  };
  const onEnd = () => {
    setDragging(false);
    setHover(null);
    setLocked(false);
  };
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <label htmlFor="score" className="text-sm font-semibold">
          Your score
        </label>
        <span aria-hidden className="flex items-baseline gap-2">
          {shown > 0 && <span className="text-sm font-semibold text-muted-foreground">{verdict(shown).label}</span>}
          <span className="inline-flex overflow-hidden text-3xl leading-none font-bold tabular-nums">
            <span
              key={shown}
              className={cn(
                shown ? "animate-[roll-up_140ms_var(--ease-out)] bg-(image:--score-gradient) bg-clip-text text-transparent" : "text-faint",
                hover !== null && hover !== score && "opacity-70",
              )}
            >
              {shown ? formatScore(shown) : "–"}
            </span>
            <span className="self-end text-base font-semibold text-faint">/10</span>
          </span>
        </span>
      </div>
      <div className="relative rounded-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-4 has-[:focus-visible]:ring-offset-background">
        <div aria-hidden className="flex h-32 items-end gap-1">
          {STEPS.map((v) => {
            const lit = v <= shown;
            // Picking a score ripples outward from the previous one, 12ms per half step; a hover preview tracks instantly.
            const changed = (v > from && v <= score) || (v > score && v <= from);
            const delay = hover === null && changed ? Math.abs(v - from) * 24 : 0;
            return (
              <span
                key={v}
                className={cn(
                  "flex-1 origin-bottom rounded-t-[3px] transition-[background-color,opacity,transform] duration-150 ease-[var(--ease-out)]",
                  !lit && "bg-raised",
                  lit && hover !== null && v > score && "opacity-60", // previewed, not picked yet
                  v === shown && shown > 0 && "scale-y-[1.04]",
                )}
                style={{
                  height: `${v * 10}%`,
                  transitionDelay: `${delay}ms`,
                  backgroundColor: lit ? scoreColor(v) : undefined,
                }}
              />
            );
          })}
        </div>
        <input
          id="score"
          type="range"
          name={score ? "score" : undefined}
          min={1}
          max={10}
          step={0.5}
          value={score || 1}
          aria-valuetext={score ? `${formatScore(score)} out of 10, ${verdict(score).label}` : "Not scored yet"}
          onChange={(e) => pick(Number(e.target.value))}
          tabIndex={0}
          className="pointer-events-none absolute inset-0 size-full appearance-none opacity-0"
        />
        {/* Pointer layer over the bars (the slider underneath keeps keyboard and screen-reader use). */}
        <div
          aria-hidden
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={(e) => {
            if (dragging) pick(valueAt(e));
            setDragging(false);
          }}
          onPointerCancel={onEnd}
          onPointerLeave={onEnd}
          className={cn("absolute inset-0 touch-pan-y", locked ? "cursor-default" : "cursor-pointer")}
        />
      </div>
      <div aria-hidden className="mt-1.5 flex gap-1 text-center text-xs text-faint tabular-nums">
        {STEPS.map((v) => (
          <span key={v} className={cn("flex-1", Math.floor(shown) === v && "font-semibold text-foreground")}>
            {Number.isInteger(v) ? v : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
