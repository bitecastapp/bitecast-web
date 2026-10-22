import { UsersRoundIcon } from "lucide-react";
import { scoreColor } from "@/lib/ratings";
import { cn } from "@/lib/utils";

type Props = { avg: number | null; count: number; labeled?: boolean; orEmpty?: boolean; className?: string };

// Everyone's score for a dish: a people icon in the score's colour (ketchup when low, mustard when high) and the number,
// at the surrounding text size. `labeled` is the opened post's version, with "Overall rating" spelled out.
// `orEmpty` says "No ratings yet" instead of nothing. How many ratings it's from stays in the tooltip and for screen readers.
export function DishAvg({ avg, count, labeled, orEmpty, className }: Props) {
  if (!count || avg === null) return orEmpty ? <span className={className}>No ratings yet</span> : null;
  const score = Number(avg).toFixed(1);
  const from = `from ${count} ${count === 1 ? "rating" : "ratings"}`;
  return (
    <span
      title={`Overall rating ${score}, ${from}`}
      className={cn("inline-flex items-center gap-1 align-middle whitespace-nowrap tabular-nums", labeled && "gap-1.5 text-sm", className)}
    >
      <UsersRoundIcon aria-hidden className={cn("shrink-0", labeled ? "size-3.5 text-faint" : "size-[1.05em]")} style={labeled ? undefined : { color: scoreColor(Number(score)) }} />
      {labeled ? (
        <>
          <span className="font-medium text-muted-foreground">Overall rating</span>
          <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: scoreColor(Number(score)) }} />
        </>
      ) : (
        <span className="sr-only">Overall rating</span>
      )}
      <span className="font-semibold text-foreground">{score}</span>
      <span className="sr-only">, {from}</span>
    </span>
  );
}
