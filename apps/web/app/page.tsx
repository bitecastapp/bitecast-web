import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Screen } from "@/components/screen";
import { HomeView } from "./home-view";

export default function HomePage() {
  return (
    <Suspense fallback={<Screen step={5}>{null}</Screen>}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const { profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  return <HomeView profile={profile} />;
}
