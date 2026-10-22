import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { dishHref } from "@/lib/dishes";
import { getMyVotes, getReview, type Vote } from "@/lib/ratings";
import { getMyCommentVotes, getThreads } from "@/lib/comments";
import { Comments } from "@/components/comments";
import { PageShell } from "@/components/page-shell";
import { ReviewCard } from "@/components/review-card";
import { BackLink } from "@/components/back-link";
import { RateAnother } from "@/components/rate-another";
import { getDishesToRate } from "@/lib/restaurants";

export const metadata: Metadata = { title: "Take · Bitecast" };

export default function ReviewPage({ params }: PageProps<"/review/[id]">) {
  return (
    <Suspense fallback={<PageShell>{null}</PageShell>}>
      <ReviewScreen params={params} />
    </Suspense>
  );
}

async function ReviewScreen({ params }: Pick<PageProps<"/review/[id]">, "params">) {
  const { id } = await params;
  const { supabase, userId, profile } = await getViewer();
  const review = await getReview(supabase, id);
  if (!review?.take) notFound();
  const [votes, threads] = await Promise.all([profile ? getMyVotes(supabase, [review.id]) : ({} as Record<string, Vote>), getThreads(supabase, review.id)]);
  const own = Boolean(userId && profile?.username === review.author.username);
  const [commentVotes, next] = await Promise.all([
    profile ? getMyCommentVotes(supabase, threads.flatMap((t) => [t.id, ...t.replies.map((r) => r.id)])) : {},
    own && userId ? getDishesToRate(supabase, userId, review.dish.restaurant.slug) : null,
  ]);

  return (
    <PageShell wide>
      <BackLink href="/" />
      {/* Desktop: the take and its comments at reading width, the dish it's about pinned alongside. */}
      <div className="mt-2 pb-10 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-12 xl:gap-16">
        <div className="min-w-0 lg:max-w-2xl">
          <ReviewCard review={review} vote={votes[review.id]} viewer={profile?.username ?? null} full />
          {next && (
            <div className="mb-6">
              <RateAnother restaurant={next.restaurant} dishes={next.dishes} />
            </div>
          )}
          <Comments ratingId={review.id} threads={threads} votes={commentVotes} viewer={profile?.username ?? null} />
        </div>
        <aside aria-labelledby="about-dish" className="hidden rounded-lg border border-hairline bg-paper p-5 lg:sticky lg:top-6 lg:block">
          <p className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">The dish</p>
          <h2 id="about-dish" className="mt-2 text-lg leading-snug font-semibold wrap-anywhere">
            {review.dish.name}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <Link href={`/r/${review.dish.restaurant.slug}`} className="font-medium underline-offset-4 hover:text-foreground hover:underline">
              {review.dish.restaurant.name}
            </Link>
            , {review.dish.restaurant.area}
          </p>
          <Link
            href={dishHref(review.dish.restaurant.slug, review.dish.name)}
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-hairline text-sm font-semibold hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            See every take
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}
