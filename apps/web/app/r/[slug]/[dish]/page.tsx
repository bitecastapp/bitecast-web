import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { keyFromDishSlug } from "@/lib/dishes";
import { getDish, getDishesToRate } from "@/lib/restaurants";
import { RateAnother } from "@/components/rate-another";
import { getDishRatings, getMyVotes } from "@/lib/ratings";
import { PageShell } from "@/components/page-shell";
import { DishView } from "./dish-view";

export default function DishPage({ params, searchParams }: PageProps<"/r/[slug]/[dish]">) {
  return (
    <Suspense fallback={<PageShell>{null}</PageShell>}>
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
  const [votes, next] = await Promise.all([
    profile ? getMyVotes(supabase, ratings.map((r) => r.id)) : {},
    rated && userId ? getDishesToRate(supabase, userId, slug) : null,
  ]);
  return (
    <DishView
      dish={dish}
      ratings={ratings}
      votes={votes}
      viewer={profile?.username ?? null}
      sort={sort === "new" ? "new" : "top"}
      rateNext={next && <RateAnother restaurant={next.restaurant} dishes={next.dishes} />}
    />
  );
}
