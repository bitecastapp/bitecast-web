import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { dishHref } from "@/lib/dishes";
import { getMyVotes, getReview } from "@/lib/ratings";
import { PageShell } from "@/components/page-shell";
import { ReviewCard } from "@/components/review-card";
import { BackLink } from "@/app/r/[slug]/restaurant-view";

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
  const { supabase, profile } = await getViewer();
  const review = await getReview(supabase, id);
  if (!review?.take) notFound();
  const votes = profile ? await getMyVotes(supabase, [review.id]) : {};

  return (
    <PageShell>
      <BackLink href={dishHref(review.dish.restaurant.slug, review.dish.name)}>{review.dish.name}</BackLink>
      <div className="mt-2 pb-10">
        <ReviewCard review={review} vote={votes[review.id]} viewer={profile?.username ?? null} full />
        <p className="mt-4 border-t border-hairline pt-6 text-sm text-muted-foreground">Comments are coming next.</p>
      </div>
    </PageShell>
  );
}
