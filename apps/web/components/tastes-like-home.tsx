import { HouseHeartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { avg: number | null; count: number; demonym: string | undefined; className?: string };

// "Tastes like home: 8.7 from 12 Kannadigas": how people from the food's home region rate this dish.
// The database only sends an average from 3 ratings up; below that (or with no home region) nothing shows.
export function TastesLikeHome({ avg, count, demonym, className }: Props) {
  if (avg === null || !demonym) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
      <HouseHeartIcon aria-hidden className="size-4 shrink-0 text-mustard" />
      <span>
        Tastes like home: <span className="font-semibold text-foreground tabular-nums">{avg.toFixed(1)}</span> from {count} {demonym}
      </span>
    </span>
  );
}
