import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { keyFromDishSlug } from "@/lib/dishes";
import { getDish, getDishesToRate } from "@/lib/restaurants";
import { RateAnother } from "@/components/rate-another";
import { SaveButton } from "@/components/save-button";
import { countWanted, isSaved } from "@/lib/profiles";
import { getDishRatings, getMyVotes } from "@/lib/ratings";
import { PageShell } from "@/components/page-shell";
import { PageLoader } from "@/components/loader";
import { DishView } from "./dish-view";

export default function DishPage({ params, searchParams }: PageProps<"/r/[slug]/[dish]">) {
  return (
    <Suspense
      fallback={
        <PageShell wide>
          <PageLoader />
        </PageShell>
      }
    >
      <Dish params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Dish({ params, searchParams }: Pick<PageProps<"/r/[slug]/[dish]">, "params" | "searchParams">) {
  const [{ slug, dish: dishSlug }, { sort }] = await Promise.all([params, searchParams]);
  const { supabase, userId, profile } = await getViewer();
  const dish = await getDish(supabase, slug, keyFromDishSlug(decodeURIComponent(dishSlug)));
  if (!dish) notFound();
  const ratings = await getDishRatings(supabase, dish.id);
  const rated = Boolean(userId && ratings.some((r) => r.author.username === profile?.username));
  const [votes, next, saved, wanted] = await Promise.all([
    profile ? getMyVotes(supabase, ratings.map((r) => r.id)) : {},
    rated && userId ? getDishesToRate(supabase, userId, slug) : null,
    userId && !rated ? isSaved(supabase, userId, dish.id) : false,
    countWanted(supabase, dish.id),
  ]);
  return (
    <DishView
      dish={dish}
      ratings={ratings}
      votes={votes}
      viewer={profile?.username ?? null}
      sort={sort === "new" ? "new" : "top"}
      rateNext={next && <RateAnother restaurant={next.restaurant} dishes={next.dishes} />}
      save={<SaveButton dishId={dish.id} saved={saved} signedIn={Boolean(profile)} />}
      wanted={wanted}
    />
  );
}
