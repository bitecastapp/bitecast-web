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
import { PageLoader } from "@/components/loader";
import { ReviewCard } from "@/components/review-card";
import { BackLink } from "@/components/back-link";
import { RateAnother } from "@/components/rate-another";
import { ReportButton } from "@/components/report-button";
import { TakeActions } from "@/components/take-actions";
import { getDishesToRate } from "@/lib/restaurants";
import { getSaveStates } from "@/lib/profiles";
import { shareTake } from "@/lib/share";

export async function generateMetadata({ params }: PageProps<"/review/[id]">): Promise<Metadata> {
  const { id } = await params;
  const t = await shareTake(id);
  if (!t) return { title: "Take not found · Nomrank" };
  const title = `@${t.author} on ${t.dish} · Nomrank`;
  const description = `${t.score}/10 for ${t.dish} at ${t.place}: “${t.take.length > 140 ? `${t.take.slice(0, 138)}…` : t.take}”`;
  return { title, description, openGraph: { title, description, type: "article" } };
}

export default function ReviewPage({ params }: PageProps<"/review/[id]">) {
  return (
    <Suspense
      fallback={
        <PageShell wide>
          <PageLoader />
        </PageShell>
      }
    >
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
  const [commentVotes, next, saves] = await Promise.all([
    profile ? getMyCommentVotes(supabase, threads.flatMap((t) => [t.id, ...t.replies.map((r) => r.id)])) : {},
    own && userId ? getDishesToRate(supabase, userId, review.dish.restaurant.slug) : null,
    getSaveStates(supabase, profile ? userId : null, [review.dish.id]),
  ]);

  return (
    <PageShell wide>
      <BackLink href={dishHref(review.dish.restaurant.slug, review.dish.name)} />
      {/* Desktop: the take and its comments at reading width, the dish it's about pinned alongside. */}
      <div className="mt-2 pb-10 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-12 xl:gap-16">
        <div className="min-w-0 lg:max-w-2xl">
          <ReviewCard review={review} vote={votes[review.id]} saved={saves[review.dish.id]} viewer={profile?.username ?? null} full />
          <div className="-mt-2 mb-4 flex justify-end gap-1">
            {own ? (
              <TakeActions ratingId={review.id} dishId={review.dish.id} />
            ) : (
              <ReportButton targetType="rating" targetId={review.id} what="this take" signedIn={Boolean(profile)} />
            )}
          </div>
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
