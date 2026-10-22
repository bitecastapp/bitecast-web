"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const daysIn = (year: number, month: number) => new Date(Date.UTC(year || 2000, month, 0)).getUTCDate(); // month is 1-based; leap-safe

type Part = "day" | "month" | "year";
type Props = { name: string; defaultValue: string; minAge?: number };

// Birthday as Day · Month · Year, with Bitecast's own pickers (no browser dropdowns): tap a part and a grid opens
// under the field (days, months, or years newest first); picking one moves on to the next part.
// Escape or a tap outside closes it. Submits YYYY-MM-DD, or "" until all three are set.
export function DateOfBirthField({ name, defaultValue, minAge = 13 }: Props) {
  const [y0, m0, d0] = defaultValue ? defaultValue.split("-").map(Number) : [0, 0, 0];
  const [day, setDay] = useState(d0 || 0);
  const [month, setMonth] = useState(m0 || 0);
  const [year, setYear] = useState(y0 || 0);
  const [open, setOpen] = useState<Part | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const uid = useId();
  const triggerId = (part: Part) => `${uid}-${part}`;
  const focusTrigger = (part: Part) => document.getElementById(triggerId(part))?.focus();
  const panel = useRef<HTMLDivElement>(null);

  const latestYear = new Date().getFullYear() - minAge;
  const years = Array.from({ length: latestYear - 1900 + 1 }, (_, i) => latestYear - i);
  const maxDay = month ? daysIn(year, month) : 31;
  const safeDay = Math.min(day, maxDay);
  const complete = Boolean(safeDay && month && year);
  const partial = !complete && Boolean(safeDay || month || year);
  const value = complete ? `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}` : "";

  // Close on a tap outside or Escape (focus back on the part that was open).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        document.getElementById(`${uid}-${open}`)?.focus();
        setOpen(null);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    // Focus the chosen option (or the first) and bring it into view, e.g. a year far down the list.
    const target = panel.current?.querySelector<HTMLButtonElement>("[aria-pressed=true]") ?? panel.current?.querySelector<HTMLButtonElement>("button");
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "nearest" });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, uid]);

  function choose(part: Part, n: number) {
    if (part === "day") setDay(n);
    if (part === "month") setMonth(n);
    if (part === "year") setYear(n);
    // Move on to the next part that's still empty; when all three are set, close.
    const filled = { day: safeDay, month, year, [part]: n };
    const next = (["day", "month", "year"] as const).find((p) => !filled[p]);
    setOpen(next ?? null);
    if (!next) focusTrigger(part);
  }

  const trigger = (part: Part, label: string, shown: string, grow: string) => (
    <button
      id={triggerId(part)}
      type="button"
      aria-expanded={open === part}
      aria-haspopup="dialog"
      onClick={() => setOpen(open === part ? null : part)}
      className={cn(
        "relative flex min-w-0 flex-col items-start justify-center px-3.5 py-2 text-left transition-colors focus-visible:z-10 focus-visible:bg-muted focus-visible:outline-none",
        open === part ? "bg-mustard/10" : "hover:bg-muted/60",
        grow,
      )}
    >
      <span className="text-[0.6875rem] font-semibold tracking-[0.06em] text-faint uppercase">{label}</span>
      <span className={cn("truncate text-base font-semibold", shown ? "text-foreground" : "text-muted-foreground")}>{shown || "–"}</span>
      <ChevronDownIcon
        aria-hidden
        className={cn("absolute right-3 bottom-3 size-4 text-muted-foreground transition-transform duration-200", open === part && "rotate-180 text-mustard")}
      />
    </button>
  );

  const option = (selected: boolean, label: string, onPick: () => void, key: string | number) => (
    <button
      key={key}
      type="button"
      aria-pressed={selected}
      onClick={onPick}
      className={cn(
        "grid min-h-10 place-items-center rounded-lg text-sm font-semibold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected ? "bg-mustard text-studio" : "text-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );

  return (
    <div ref={root} className="relative">
      <input type="hidden" name={name} value={value} />
      <div
        role="group"
        aria-label="Date of birth"
        className={cn(
          "flex divide-x divide-hairline overflow-hidden rounded-xl border bg-raised transition-colors",
          open ? "border-mustard" : "border-input",
        )}
      >
        {trigger("day", "Day", safeDay ? String(safeDay) : "", "w-[26%]")}
        {trigger("month", "Month", month ? MONTHS[month - 1] : "", "flex-1")}
        {trigger("year", "Year", year ? String(year) : "", "w-[30%]")}
      </div>

      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label={`Choose ${open}`}
          className="absolute inset-x-0 top-full z-30 mt-2 origin-top animate-[rise-in_180ms_var(--ease-out)] rounded-xl border border-hairline bg-paper p-2 shadow-[0_16px_40px_-16px_rgb(0_0_0/0.8)]"
        >
          {open === "day" && (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: maxDay }, (_, i) => option(safeDay === i + 1, String(i + 1), () => choose("day", i + 1), i))}
            </div>
          )}
          {open === "month" && (
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((m, i) => option(month === i + 1, m.slice(0, 3), () => choose("month", i + 1), m))}
            </div>
          )}
          {open === "year" && (
            <div className="grid max-h-60 grid-cols-4 gap-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
              {years.map((y) => option(year === y, String(y), () => choose("year", y), y))}
            </div>
          )}
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
        <p className={partial ? "text-mustard" : "text-muted-foreground"} aria-live="polite">
          {partial ? "Pick the day, month and year." : "You need to be 13 or older to use Bitecast."}
        </p>
        {(complete || partial) && (
          <button
            type="button"
            onClick={() => {
              setDay(0);
              setMonth(0);
              setYear(0);
              setOpen(null);
            }}
            className="shrink-0 rounded-md px-1 font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
