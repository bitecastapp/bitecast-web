import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { getRestaurant } from "@/lib/restaurants";
import { PageShell } from "@/components/page-shell";
import { PageLoader } from "@/components/loader";
import { RestaurantView } from "./restaurant-view";

export default function RestaurantPage({ params }: PageProps<"/r/[slug]">) {
  return (
    <Suspense
      fallback={
        <PageShell wide>
          <PageLoader />
        </PageShell>
      }
    >
      <Restaurant params={params} />
    </Suspense>
  );
}

async function Restaurant({ params }: Pick<PageProps<"/r/[slug]">, "params">) {
  const { slug } = await params;
  const { supabase, profile } = await getViewer();
  const restaurant = await getRestaurant(supabase, slug);
  if (!restaurant) notFound();
  return <RestaurantView restaurant={restaurant} signedIn={Boolean(profile)} />;
}
