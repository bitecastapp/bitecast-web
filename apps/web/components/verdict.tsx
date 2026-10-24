import { verdict } from "@/lib/ratings";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand";

const VERDICT_TONE = {
  must: "bg-mustard/15 text-mustard",
  again: "bg-raised text-mustard",
  clean: "bg-raised text-foreground",
  okay: "bg-raised text-muted-foreground",
  skip: "bg-raised text-ketchup",
  back: "bg-ketchup/15 text-ketchup",
};

// The score in words, from "Send it back" to "Must try"; Must try carries the Nomrank badge. `icon` swaps the badge
// for the app icon image (the coming soon page), which looks the same everywhere because it needs no web font.
export function Verdict({ score, icon }: { score: number; icon?: boolean }) {
  const v = verdict(score);
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[0.6875rem] font-semibold tracking-[0.04em] whitespace-nowrap uppercase",
        v.tone === "must" && "pl-0.5",
        VERDICT_TONE[v.tone],
      )}
    >
      {v.tone === "must" &&
        (icon ? (
          // eslint-disable-next-line @next/next/no-img-element -- the generated app icon (app/icon.tsx), shown at 16px
          <img src="/icon" alt="" width={16} height={16} className="size-4 shrink-0 rounded-full" />
        ) : (
          <LogoMark size={16} />
        ))}
      {v.label}
    </span>
  );
}
