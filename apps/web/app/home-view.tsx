import { LogOutIcon } from "lucide-react";
import type { Profile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/screen";
import { signOut } from "./actions";

export function HomeView({ profile }: { profile: Profile }) {
  return (
    <Screen step={5}>
      <div className="flex flex-1 animate-[rise_500ms_var(--ease-out-expo)_both] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">
            You&apos;re in,
            <span className="block text-2xl wrap-anywhere text-bloom">@{profile.username}</span>
          </h1>
          <p className="text-muted-foreground">
            Home: <span className="font-semibold text-foreground">{profile.regions?.name ?? profile.home_region}</span>
          </p>
          <p className="text-muted-foreground">
            Spaces open soon: one leaderboard per food, from biryani to dosa. Your first rating goes here.
          </p>
        </div>
        <form action={signOut} className="mt-auto md:mt-2">
          <Button type="submit" size="xl" variant="ghost" className="w-full">
            <LogOutIcon data-icon="inline-start" />
            Sign out
          </Button>
        </form>
      </div>
    </Screen>
  );
}
