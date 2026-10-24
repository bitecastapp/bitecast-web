import { formatScore, scoreColor, verdict } from "@/lib/ratings";
import { cn } from "@/lib/utils";

// "Must try" scores get a scalloped award-badge edge instead of a plain circle.
const BADGE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='41'/%3E%3Ccircle cx='90.00' cy='50.00' r='9.5'/%3E%3Ccircle cx='86.04' cy='67.36' r='9.5'/%3E%3Ccircle cx='74.94' cy='81.27' r='9.5'/%3E%3Ccircle cx='58.90' cy='89.00' r='9.5'/%3E%3Ccircle cx='41.10' cy='89.00' r='9.5'/%3E%3Ccircle cx='25.06' cy='81.27' r='9.5'/%3E%3Ccircle cx='13.96' cy='67.36' r='9.5'/%3E%3Ccircle cx='10.00' cy='50.00' r='9.5'/%3E%3Ccircle cx='13.96' cy='32.64' r='9.5'/%3E%3Ccircle cx='25.06' cy='18.73' r='9.5'/%3E%3Ccircle cx='41.10' cy='11.00' r='9.5'/%3E%3Ccircle cx='58.90' cy='11.00' r='9.5'/%3E%3Ccircle cx='74.94' cy='18.73' r='9.5'/%3E%3Ccircle cx='86.04' cy='32.64' r='9.5'/%3E%3C/svg%3E")`;

// The score as a tilted sticker. Its colour runs ketchup (low) to mustard (high) with the score,
// and "Must try" scores (9+) become a scalloped badge so the best dishes stand out in a feed.
export function Score({ score, size = 52, className }: { score: number; size?: number; className?: string }) {
  const text = formatScore(score);
  const badge = verdict(score).tone === "must";
  const fill = scoreColor(score);
  const roomy = size >= 48; // the "/10" (or n) and the dashed ring only fit on the bigger sticker
  return (
    <span
      role="img"
      aria-label={`${text} out of 10`}
      className={cn("relative inline-grid shrink-0 -rotate-[8deg] place-items-center text-studio", className)}
      style={{ width: size, height: size, filter: `drop-shadow(0 5px 10px color-mix(in oklab, ${fill} 45%, transparent))` }}
    >
      <span
        aria-hidden
        className={cn("absolute inset-0", !badge && "rounded-full")}
        style={{
          // A soft top-left highlight on the fill, so it reads as a printed sticker rather than a flat dot.
          background: `radial-gradient(circle at 30% 25%, rgb(255 255 255 / 0.28), transparent 55%), ${fill}`,
          ...(badge && { maskImage: BADGE, WebkitMaskImage: BADGE, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }),
        }}
      />
      {roomy && <span aria-hidden className={cn("absolute rounded-full border-[1.5px] border-dashed border-studio/40", badge ? "inset-[17%]" : "inset-1")} />}
      <span aria-hidden className="relative text-center leading-none">
        <span className="block font-extrabold tracking-[-0.04em] tabular-nums" style={{ fontSize: size * (text.length > 2 ? 0.33 : 0.38) }}>
          {text}
        </span>
        {/* Must try badges carry the Nomrank "n" (Suez One, like the logo) where other stickers say "/ 10". */}
        {roomy &&
          (badge ? (
            <span className="mt-0.5 block font-mark" style={{ fontSize: size * 0.22 }}>
              n
            </span>
          ) : (
            <span className="mt-px block text-[8px] font-bold tracking-[0.12em]">/ 10</span>
          ))}
      </span>
    </span>
  );
}
