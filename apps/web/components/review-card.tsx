import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";
import { dishHref } from "@/lib/dishes";
import { formatScore, scoreColor, verdict, type Review, type Vote } from "@/lib/ratings";
import { cn } from "@/lib/utils";
import { VoteButtons } from "@/components/vote-buttons";
import { PhotoCarousel } from "@/components/photo-carousel";
import { DietMark } from "@/components/diet-mark";
import { timeAgo } from "@/lib/time";

// "Must try" scores get a scalloped award-badge edge instead of a plain circle.
const BADGE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='41'/%3E%3Ccircle cx='90.00' cy='50.00' r='9.5'/%3E%3Ccircle cx='86.04' cy='67.36' r='9.5'/%3E%3Ccircle cx='74.94' cy='81.27' r='9.5'/%3E%3Ccircle cx='58.90' cy='89.00' r='9.5'/%3E%3Ccircle cx='41.10' cy='89.00' r='9.5'/%3E%3Ccircle cx='25.06' cy='81.27' r='9.5'/%3E%3Ccircle cx='13.96' cy='67.36' r='9.5'/%3E%3Ccircle cx='10.00' cy='50.00' r='9.5'/%3E%3Ccircle cx='13.96' cy='32.64' r='9.5'/%3E%3Ccircle cx='25.06' cy='18.73' r='9.5'/%3E%3Ccircle cx='41.10' cy='11.00' r='9.5'/%3E%3Ccircle cx='58.90' cy='11.00' r='9.5'/%3E%3Ccircle cx='74.94' cy='18.73' r='9.5'/%3E%3Ccircle cx='86.04' cy='32.64' r='9.5'/%3E%3C/svg%3E")`;

// The score as a tilted sticker. Its colour runs ketchup (low) to mustard (high) with the score,
// and "Must try" scores (9+) become a scalloped badge so the best dishes stand out in a feed.
export function Score({ score, size = 52, className }: { score: number; size?: number; className?: string }) {
  const text = formatScore(score);
  const badge = verdict(score).tone === "must";
  const fill = scoreColor(score);
  const roomy = size >= 48; // the "/10" and the dashed ring only fit on the bigger sticker
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
        {roomy && <span className="mt-px block text-[8px] font-bold tracking-[0.12em]">/ 10</span>}
      </span>
    </span>
  );
}

const VERDICT_TONE = {
  must: "bg-mustard/15 text-mustard",
  good: "bg-raised text-foreground",
  meh: "bg-raised text-muted-foreground",
  skip: "bg-ketchup/15 text-ketchup",
};

// "Must try" / "Worth it" / "It's okay" / "Skip it": the score in words.
function Verdict({ score }: { score: number }) {
  const v = verdict(score);
  return (
    <span className={cn("inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[0.6875rem] font-semibold tracking-[0.04em] uppercase", VERDICT_TONE[v.tone])}>
      {v.label}
    </span>
  );
}

type Props = {
  review: Review;
  vote?: Vote;
  viewer: string | null; // the viewer's username, or null when signed out
  showDish?: boolean; // feeds show the dish; a dish page doesn't need to repeat it
  full?: boolean; // the review page: no clamping, every photo large
  inMeal?: boolean; // one dish inside a meal card, whose header already names the place and the author
};

// One take in a list. Feeds lead with the dish (score + name + place) and sign the take underneath;
// on a dish page the dish is already the subject, so the author leads instead.
export function ReviewCard({ review: r, vote, viewer, showDish = true, full, inMeal }: Props) {
  const mode = !viewer ? "signed-out" : viewer === r.author.username ? "own" : "vote";
  const byline = (
    <>
      <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-raised text-[0.6875rem] font-semibold text-muted-foreground uppercase">
        {r.author.username[0]}
      </span>
      <span className="min-w-0 truncate font-semibold text-muted-foreground">@{r.author.username}</span>
      <time dateTime={r.created_at} className="shrink-0 text-faint">
        {timeAgo(r.created_at)}
      </time>
    </>
  );
  return (
    <article className={cn("relative", inMeal ? "py-4" : "py-5")}>
      {!showDish && (
        <header className="mb-3 flex items-center gap-2.5 text-sm">
          {byline}
          <span className="ml-auto flex items-center gap-2">
            <Verdict score={r.score} />
            <Score score={r.score} size={40} />
          </span>
        </header>
      )}

      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {showDish && (
            <header>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <DietMark veg={r.dish.veg} />
                  <Link
                    href={dishHref(r.dish.restaurant.slug, r.dish.name)}
                    className="relative z-10 text-[1.0625rem] leading-snug font-bold tracking-[-0.01em] wrap-anywhere hover:underline"
                  >
                    {r.dish.name}
                  </Link>
                  <Verdict score={r.score} />
                </div>
                {!inMeal && (
                  <p className="mt-0.5 text-sm text-faint wrap-anywhere">
                    from{" "}
                    <Link
                      href={`/r/${r.dish.restaurant.slug}`}
                      className="relative z-10 font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {r.dish.restaurant.name}
                    </Link>
                  </p>
                )}
              </div>
            </header>
          )}
          <p className={cn("text-[0.9375rem] leading-relaxed text-foreground/90 wrap-anywhere", showDish && "mt-3", !full && "line-clamp-6")}>
            {full ? (
              r.take
            ) : (
              <Link href={`/review/${r.id}`} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-ring">
                {r.take}
              </Link>
            )}
          </p>
          {r.photos.length > 0 && (
            <PhotoCarousel
              photos={r.photos}
              dish={r.dish.name}
              href={full ? undefined : `/review/${r.id}`}
              className={cn("aspect-[4/3] w-full", full ? "mt-4 max-w-md" : "mt-3 max-w-72")}
            />
          )}
          {showDish && !inMeal && <p className="mt-2.5 flex items-center gap-2 text-[0.8125rem]">{byline}</p>}
        </div>
        {showDish && <Score score={r.score} size={inMeal ? 44 : undefined} />}
      </div>

      <div className="mt-3 flex items-start gap-3">
        <VoteButtons ratingId={r.id} facts={r.facts_count} cap={r.cap_count} mine={vote} mode={mode} />
        {!full && (
          <Link
            href={`/review/${r.id}#comments`}
            aria-label={`${r.comments_count} ${r.comments_count === 1 ? "comment" : "comments"}`}
            className="relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm text-muted-foreground tabular-nums hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <MessageCircleIcon aria-hidden className="size-[18px]" />
            {r.comments_count}
          </Link>
        )}
      </div>
    </article>
  );
}
