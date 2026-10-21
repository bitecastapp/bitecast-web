import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const restaurant = await getRestaurant(supabase, slug);
  if (!restaurant) notFound();
  return <RestaurantView restaurant={restaurant} />;
}
