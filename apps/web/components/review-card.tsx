import Link from "next/link";
import { dishHref } from "@/lib/dishes";
import { photoUrl, type Review, type Vote } from "@/lib/ratings";
import { cn } from "@/lib/utils";
import { VoteButtons } from "@/components/vote-buttons";
import { timeAgo } from "@/lib/time";

// The score as a Ketchup disc with a bite taken out of its corner (after the bites in the logo).
export function Score({ score, size = 28, className }: { score: number; size?: number; className?: string }) {
  return (
    <span aria-label={`${score} out of 10`} className={cn("relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg aria-hidden viewBox="0 0 28 28" className="absolute inset-0 size-full">
        <path
          className="fill-ketchup"
          d="M14 0a14 14 0 0 1 9.8 4a3.4 3.4 0 0 0 .3 4.9a3.4 3.4 0 0 0 3.4 1.1A14 14 0 1 1 14 0Z"
        />
      </svg>
      <span className="relative text-[0.8125em] font-bold text-studio tabular-nums" style={{ fontSize: size * 0.5 }}>
        {score}
      </span>
    </span>
  );
}

type Props = {
  review: Review;
  vote?: Vote;
  viewer: string | null; // the viewer's username, or null when signed out
  showDish?: boolean; // feeds show the dish; a dish page doesn't need to repeat it
  full?: boolean; // the review page: no clamping, every photo large
};

// One take in a list: who + score, the dish, the take, thumbnails, votes. Hairline-separated, no card chrome.
export function ReviewCard({ review: r, vote, viewer, showDish = true, full }: Props) {
  const mode = !viewer ? "signed-out" : viewer === r.author.username ? "own" : "vote";
  return (
    <article className="relative py-5">
      <header className="flex items-center gap-2.5 text-sm">
        <span aria-hidden className="grid size-7 place-items-center rounded-full bg-raised text-xs font-semibold text-muted-foreground uppercase">
          {r.author.username[0]}
        </span>
        <span className="min-w-0 truncate font-semibold">@{r.author.username}</span>
        <Score score={r.score} />
        <time dateTime={r.created_at} className="ml-auto shrink-0 text-faint">
          {timeAgo(r.created_at)}
        </time>
      </header>

      <div className="mt-3 flex gap-4">
        <div className="min-w-0 flex-1">
          {showDish && (
            <p className="text-[0.9375rem] leading-snug">
              <Link href={dishHref(r.dish.restaurant.slug, r.dish.name)} className="relative z-10 font-semibold wrap-anywhere hover:underline">
                {r.dish.name}
              </Link>
              <span className="text-muted-foreground"> · {r.dish.restaurant.name}</span>
            </p>
          )}
          <p className={cn("mt-1.5 text-[0.9375rem] leading-relaxed text-foreground/90 wrap-anywhere", !full && "line-clamp-6")}>
            {full ? (
              r.take
            ) : (
              <Link href={`/review/${r.id}`} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-ring">
                {r.take}
              </Link>
            )}
          </p>
        </div>
        {!full && r.photos[0] && (
          <span className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-md bg-raised">
            {/* eslint-disable-next-line @next/next/no-img-element -- user photos from Supabase Storage, resized on upload */}
            <img src={photoUrl(r.photos[0].path)} alt={`Photo of ${r.dish.name}`} className="size-full object-cover" loading="lazy" />
            {r.photos.length > 1 && (
              <span className="absolute right-1 bottom-1 rounded bg-studio/80 px-1 text-xs font-semibold">+{r.photos.length - 1}</span>
            )}
          </span>
        )}
      </div>

      {full && r.photos.length > 0 && (
        <div className="-mx-5 mt-4 flex snap-x scroll-px-5 gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
          {r.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- see above
            <img key={p.path} src={photoUrl(p.path)} alt={`Photo ${i + 1} of ${r.dish.name}`} className="aspect-[4/5] w-[80%] shrink-0 snap-start rounded-md object-cover" />
          ))}
        </div>
      )}

      <div className="mt-3">
        <VoteButtons ratingId={r.id} facts={r.facts_count} cap={r.cap_count} mine={vote} mode={mode} />
      </div>
    </article>
  );
}
