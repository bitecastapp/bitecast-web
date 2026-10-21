import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRestaurants } from "@/lib/restaurants";
import { PageShell } from "@/components/page-shell";
import { HomeView } from "./home-view";

export default function HomePage() {
  return (
    <Suspense fallback={<PageShell>{null}</PageShell>}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  return <HomeView profile={profile} restaurants={await getRestaurants(supabase)} />;
}
