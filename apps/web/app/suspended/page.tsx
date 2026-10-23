import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DownloadIcon, LogOutIcon, ShieldAlertIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { PageLoader } from "@/components/loader";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/app/actions";
import { DeleteAccount } from "@/app/settings/delete-account";

export const metadata: Metadata = { title: "Account suspended · Bitecast" };

export default function SuspendedPage() {
  return (
    <PageShell>
      <Suspense fallback={<PageLoader />}>
        <Suspended />
      </Suspense>
    </PageShell>
  );
}

// Where a suspended account lands. They can still take their data, delete the account, or sign out.
async function Suspended() {
  const { profile } = await getCurrentUser({ allowSuspended: true });
  if (!profile?.banned_at) redirect("/");

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-col items-start gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-destructive/15">
          <ShieldAlertIcon aria-hidden className="size-6 text-destructive" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Your account is suspended</h1>
        <p className="text-muted-foreground">
          @{profile.username} can&apos;t post, rate, vote, comment or follow right now, because of activity that went against our{" "}
          <Link href="/about#guidelines" className="font-semibold text-foreground underline-offset-4 hover:underline">
            community guidelines
          </Link>
          . You can still download your data or delete your account.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href="/settings/export" download className={buttonVariants({ variant: "secondary", size: "lg" })}>
          <DownloadIcon data-icon="inline-start" />
          Download my data
        </a>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="lg">
            <LogOutIcon data-icon="inline-start" />
            Sign out
          </Button>
        </form>
      </div>
      <DeleteAccount handle={profile.username} />
    </div>
  );
}
