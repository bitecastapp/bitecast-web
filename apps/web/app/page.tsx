import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { getRestaurants } from "@/lib/restaurants";
import { getFeed, getMyVotes } from "@/lib/ratings";
import { PageShell } from "@/components/page-shell";
import { HomeView } from "./home-view";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<PageShell>{null}</PageShell>}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const sort = (await searchParams).sort === "new" ? "new" : "top";
  const { supabase, profile } = await getViewer();
  const [restaurants, reviews] = await Promise.all([getRestaurants(supabase), getFeed(supabase, sort)]);
  const votes = profile ? await getMyVotes(supabase, reviews.map((r) => r.id)) : {};
  return <HomeView profile={profile} restaurants={restaurants} feed={{ sort, reviews, votes }} />;
}
