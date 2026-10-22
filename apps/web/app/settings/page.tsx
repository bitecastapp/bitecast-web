import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { PageLoader } from "@/components/loader";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions";
import { DeleteAccount } from "./delete-account";
import { PreferencesForm } from "./preferences-form";
import { getPreferences } from "@/lib/profiles";

export const metadata: Metadata = { title: "Settings · Bitecast" };

export default function SettingsPage() {
  return (
    <PageShell>
      <Suspense fallback={<PageLoader />}>
        <Settings />
      </Suspense>
    </PageShell>
  );
}

const OVERLINE = "text-xs font-semibold tracking-[0.08em] text-faint uppercase";

async function Settings() {
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const [{ data }, prefs] = await Promise.all([supabase.auth.getClaims(), getPreferences(supabase, userId)]);
  const email = typeof data?.claims.email === "string" ? data.claims.email : null;

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <BackLink href="/" />
        <h1 className="mt-2 text-2xl leading-tight font-bold tracking-tight">Settings</h1>
      </div>

      <section id="preferences" aria-labelledby="preferences-title" className="scroll-mt-6">
        <h2 id="preferences-title" className={OVERLINE}>
          Preferences
        </h2>
        <PreferencesForm initial={prefs} />
      </section>

      <section aria-labelledby="account-settings">
        <h2 id="account-settings" className={OVERLINE}>
          Account
        </h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-paper p-4">
          <p className="min-w-0 text-sm text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground">@{profile.username}</span>
            {email && <span className="block wrap-anywhere">{email}</span>}
          </p>
          <form action={signOut}>
            <Button type="submit" variant="secondary" size="lg">
              <LogOutIcon data-icon="inline-start" />
              Sign out
            </Button>
          </form>
        </div>
      </section>

      <section aria-labelledby="danger-zone">
        <h2 id="danger-zone" className={OVERLINE}>
          Danger zone
        </h2>
        <DeleteAccount handle={profile.username} />
      </section>
    </div>
  );
}
