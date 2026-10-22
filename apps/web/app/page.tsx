import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { getRestaurants } from "@/lib/restaurants";
import { getFeed, getMyVotes, type FeedSort } from "@/lib/ratings";
import { getFollowees, getPreferences } from "@/lib/profiles";
import { allows, filterMenus } from "@/lib/diet";
import { PageShell } from "@/components/page-shell";
import { FeedSkeleton } from "@/components/loader";
import { HomeView } from "./home-view";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense
      fallback={
        <PageShell wide>
          <FeedSkeleton />
        </PageShell>
      }
    >
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { sort: asked, account } = await searchParams;
  const { supabase, userId, profile } = await getViewer();
  const prefs = await getPreferences(supabase, userId);
  // No ?sort → your default feed. "Following" needs a signed-in viewer; signed out it falls back to Top.
  const wanted = asked ?? prefs.feed_default;
  const sort: FeedSort = wanted === "new" ? "new" : wanted === "following" && userId ? "following" : "top";
  const authors = sort === "following" && userId ? await getFollowees(supabase, userId) : [];
  const [allRestaurants, feed] = await Promise.all([getRestaurants(supabase), getFeed(supabase, sort, authors)]);
  // shortcut: the diet filter trims the fetched feed page (so a page can show fewer than 30); filter in the query once the feed paginates.
  const restaurants = filterMenus(allRestaurants, prefs.show_diet);
  const reviews = feed.filter((r) => allows(prefs.show_diet, r.dish.diet));
  const votes = profile ? await getMyVotes(supabase, reviews.map((r) => r.id)) : {};
  return (
    <HomeView
      profile={profile}
      restaurants={restaurants}
      feed={{ sort, reviews, votes }}
      showDiet={prefs.show_diet}
      notice={account === "deleted" ? "Your account and everything in it has been deleted." : undefined}
    />
  );
}
