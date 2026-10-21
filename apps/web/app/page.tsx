import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Plate } from "@/components/plate";
import { PlateLine, Screen } from "@/components/screen";
import { signOut } from "./actions";

export default function HomePage() {
  return (
    <Suspense fallback={<Screen board={null}>{null}</Screen>}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const { profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  return (
    <Screen
      board={
        <>
          <PlateLine>
            <Plate>Hey</Plate>
          </PlateLine>
          <PlateLine>
            <Plate live className="max-w-full break-all">
              @{profile.username}
            </Plate>
          </PlateLine>
          <p className="text-base text-board-ink">
            Home: <span className="font-semibold text-plate">{profile.regions?.name ?? profile.home_region}</span>
          </p>
        </>
      }
    >
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">You&apos;re on the board</h1>
          <p className="text-muted-foreground">
            Spaces open soon: one leaderboard per food, from biryani to dosa. Your first rating goes here.
          </p>
        </div>
        <form action={signOut} className="mt-auto md:mt-0">
          <Button type="submit" size="xl" variant="ghost" className="w-full">
            <LogOutIcon data-icon="inline-start" />
            Sign out
          </Button>
        </form>
      </div>
    </Screen>
  );
}
