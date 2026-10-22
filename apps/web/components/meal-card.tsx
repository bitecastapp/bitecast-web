import Link from "next/link";
import type { Review, Vote } from "@/lib/ratings";
import { timeAgo } from "@/lib/time";
import { ReviewCard } from "@/components/review-card";

type Props = { reviews: Review[]; votes: Record<string, Vote>; viewer: string | null };

// Several takes from one person at one place, close together in time: one meal. The header names who and where once;
// each dish keeps its own score, take, photos, votes and comments, strung along a line like courses.
export function MealCard({ reviews, votes, viewer }: Props) {
  const [first] = reviews;
  const { author, dish } = first;
  const latest = reviews.reduce((a, b) => (b.created_at > a ? b.created_at : a), first.created_at);
  return (
    <article aria-label={`@${author.username} at ${dish.restaurant.name}, ${reviews.length} dishes`} className="py-5">
      <header className="flex items-center gap-2.5 text-sm">
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-raised text-xs font-semibold text-muted-foreground uppercase">
          {author.username[0]}
        </span>
        <p className="min-w-0 flex-1 leading-snug">
          <span className="font-semibold">@{author.username}</span> <span className="text-muted-foreground">had {reviews.length} dishes at</span>{" "}
          <Link href={`/r/${dish.restaurant.slug}`} className="font-semibold wrap-anywhere hover:underline">
            {dish.restaurant.name}
          </Link>
        </p>
        <time dateTime={latest} className="shrink-0 self-start text-faint">
          {timeAgo(latest)}
        </time>
      </header>
      <ol className="mt-1 ml-3.5 border-l border-hairline pl-5">
        {reviews.map((r) => (
          <li key={r.id} className="relative [&+&]:border-t [&+&]:border-hairline">
            <span aria-hidden className="absolute top-[1.6rem] -left-[26px] size-2.5 rounded-full border-2 border-studio bg-faint" />
            <ReviewCard review={r} vote={votes[r.id]} viewer={viewer} inMeal />
          </li>
        ))}
      </ol>
    </article>
  );
}
