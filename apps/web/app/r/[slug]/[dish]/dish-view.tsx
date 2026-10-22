import Link from "next/link";
import type { DishDetail } from "@/lib/restaurants";
import { photoUrl, summarize, type Review, type Sort, type Vote } from "@/lib/ratings";
import { dishHref } from "@/lib/dishes";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/page-shell";
import { ReviewCard } from "@/components/review-card";
import { BackLink } from "@/app/r/[slug]/restaurant-view";

type Props = {
  dish: DishDetail;
  ratings?: Review[];
  votes?: Record<string, Vote>;
  viewer?: string | null;
  sort?: Sort;
};

// Like a Letterboxd film page: title + poster, average and spread, your rating, then the takes.
export function DishView({ dish, ratings = [], votes = {}, viewer = null, sort = "top" }: Props) {
  const { count, average, spread } = summarize(ratings.map((r) => r.score));
  const peak = Math.max(1, ...spread);
  const mine = viewer ? ratings.find((r) => r.author.username === viewer) : undefined;
  const poster = ratings.find((r) => r.photos[0])?.photos[0];
  const reviews = ratings
    .filter((r) => r.take)
    .sort((a, b) =>
      sort === "new" ? b.created_at.localeCompare(a.created_at) : b.facts_count - b.cap_count - (a.facts_count - a.cap_count),
    );
  const href = dishHref(dish.restaurant.slug, dish.name);

  return (
    <PageShell>
      <BackLink href={`/r/${dish.restaurant.slug}`}>{dish.restaurant.name}</BackLink>

      <div className="mt-3 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.02em] wrap-anywhere">{dish.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {dish.restaurant.name}, {dish.restaurant.area}
          </p>
        </div>
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element -- user photo from Supabase Storage
          <img src={photoUrl(poster.path)} alt={`Photo of ${dish.name}`} className="aspect-[2/3] w-24 shrink-0 rounded-md object-cover" />
        )}
      </div>

      <section aria-label="Ratings" className="mt-6 flex items-end gap-6 border-y border-hairline py-4">
        <div className="shrink-0">
          <p className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">Average</p>
          <p className="mt-1 text-3xl leading-none font-semibold text-ketchup tabular-nums">{average === null ? "–" : average.toFixed(1)}</p>
          <p className="mt-1 text-xs text-faint">{count ? `${count} ${count === 1 ? "rating" : "ratings"}` : "No ratings yet"}</p>
        </div>
        <div className="flex h-14 flex-1 items-end gap-[3px]" role="img" aria-label={`Scores: ${spread.map((n, i) => `${n} rated ${i + 1}`).join(", ")}`}>
          {spread.map((n, i) => (
            <span
              key={i}
              className="flex-1 origin-bottom animate-[bar-grow_320ms_var(--ease-out)_both] rounded-t-[2px] bg-[#4a4052]"
              style={{ height: `${Math.max(3, (n / peak) * 56)}px`, animationDelay: `${i * 25}ms` }}
            />
          ))}
        </div>
      </section>

      <Link
        href={viewer ? `/rate?dish=${dish.id}` : "/login"}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-ketchup px-4 font-semibold text-studio hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        {!viewer ? "Sign in to rate" : mine ? `You rated it ${mine.score} · Change` : "Rate this dish"}
      </Link>

      <section aria-labelledby="takes" className="mt-8 pb-10">
        <div className="flex items-center justify-between gap-3 border-b border-hairline pb-2">
          <h2 id="takes" className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">
            Takes {reviews.length > 0 && <span className="tabular-nums">· {reviews.length}</span>}
          </h2>
          <nav aria-label="Sort takes" className="flex gap-4 text-sm">
            {(["top", "new"] as const).map((s) => (
              <Link
                key={s}
                href={s === "top" ? href : `${href}?sort=new`}
                scroll={false}
                aria-current={sort === s ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center capitalize focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  sort === s ? "font-semibold text-mustard" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </Link>
            ))}
          </nav>
        </div>
        {reviews.length ? (
          <ul className="divide-y divide-hairline">
            {reviews.map((r) => (
              <li key={r.id}>
                <ReviewCard review={r} vote={votes[r.id]} viewer={viewer} showDish={false} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-sm text-muted-foreground">No takes on this dish yet.</p>
        )}
      </section>
    </PageShell>
  );
}
