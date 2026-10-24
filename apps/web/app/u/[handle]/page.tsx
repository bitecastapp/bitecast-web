import { Suspense } from "react";
import { shareProfile } from "@/lib/share";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { getFavourites, getProfileByHandle, getProfileStats, getSaveStates, getSaves, isFollowing } from "@/lib/profiles";
import { tasteMatch } from "@/lib/taste";
import { getMyVotes, getUserRatings } from "@/lib/ratings";
import { PageShell } from "@/components/page-shell";
import { PageLoader } from "@/components/loader";
import { ProfileView } from "./profile-view";

export async function generateMetadata({ params }: PageProps<"/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const p = await shareProfile(handle);
  if (!p) return { title: "Profile not found · Nomrank" };
  const title = `${p.name ? `${p.name} (@${p.handle})` : `@${p.handle}`} · Nomrank`;
  const description = p.bio ?? `${p.rated} ${p.rated === 1 ? "dish" : "dishes"} rated on Nomrank.`;
  return { title, description, openGraph: { title, description, type: "profile" } };
}

export default function ProfilePage({ params, searchParams }: PageProps<"/u/[handle]">) {
  return (
    <Suspense
      fallback={
        <PageShell wide>
          <PageLoader />
        </PageShell>
      }
    >
      <Profile params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Profile({ params, searchParams }: Pick<PageProps<"/u/[handle]">, "params" | "searchParams">) {
  const [{ handle }, { tab }] = await Promise.all([params, searchParams]);
  const { supabase, userId, profile: viewer } = await getViewer();
  const profile = await getProfileByHandle(supabase, decodeURIComponent(handle).toLowerCase());
  if (!profile) notFound();

  const [stats, favourites, ratings, saves] = await Promise.all([
    getProfileStats(supabase, profile.id),
    getFavourites(supabase, profile.id),
    getUserRatings(supabase, profile.id),
    getSaves(supabase, profile.id),
  ]);
  const takes = ratings.filter((r) => r.take);
  const other = userId && userId !== profile.id ? userId : null; // a signed-in viewer looking at someone else
  const [votes, saveStates, following, mine] = await Promise.all([
    viewer ? getMyVotes(supabase, takes.map((r) => r.id)) : {},
    getSaveStates(supabase, viewer ? userId : null, takes.map((r) => r.dish.id)),
    other ? isFollowing(supabase, other, profile.id) : false,
    other ? getUserRatings(supabase, other) : null,
  ]);

  return (
    <ProfileView
      profile={profile}
      stats={stats}
      favourites={favourites}
      ratings={ratings}
      votes={votes}
      saveStates={saveStates}
      viewer={viewer?.username ?? null}
      tab={tab === "diary" || tab === "saved" ? tab : "takes"}
      saves={saves}
      following={following}
      match={mine && tasteMatch(mine, ratings)}
    />
  );
}
