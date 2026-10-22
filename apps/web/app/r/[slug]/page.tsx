import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { getRestaurant } from "@/lib/restaurants";
import { PageShell } from "@/components/page-shell";
import { RestaurantView } from "./restaurant-view";

export default function RestaurantPage({ params }: PageProps<"/r/[slug]">) {
  return (
    <Suspense fallback={<PageShell>{null}</PageShell>}>
      <Restaurant params={params} />
    </Suspense>
  );
}

async function Restaurant({ params }: Pick<PageProps<"/r/[slug]">, "params">) {
  const { slug } = await params;
  const { supabase, profile } = await getViewer();
  const restaurant = await getRestaurant(supabase, slug);
  if (!restaurant) notFound();
  // shortcut: fetches every score for this place's dishes; move to cached averages when dishes get hundreds of ratings.
  const { data: scores } = await supabase.from("ratings").select("dish_id, score").in("dish_id", restaurant.dishes.map((d) => d.id));
  return <RestaurantView restaurant={restaurant} signedIn={Boolean(profile)} scores={scores ?? []} />;
}
