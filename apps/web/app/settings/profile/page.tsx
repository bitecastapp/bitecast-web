import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPrivateDetails, getProfileByHandle } from "@/lib/profiles";
import { PageShell } from "@/components/page-shell";
import { PageLoader } from "@/components/loader";
import { BackLink } from "@/components/back-link";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Edit profile · Bitecast" };

export default function EditProfilePage() {
  return (
    <PageShell>
      <Suspense fallback={<PageLoader />}>
        <EditProfile />
      </Suspense>
    </PageShell>
  );
}

async function EditProfile() {
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const [me, secret] = await Promise.all([getProfileByHandle(supabase, profile.username), getPrivateDetails(supabase, userId)]);
  if (!me) redirect("/onboarding");

  return (
    <>
      <BackLink href={`/u/${profile.username}`} />
      <h1 className="mt-2 mb-6 text-2xl leading-tight font-bold tracking-tight">Edit profile</h1>
      <ProfileForm
        userId={userId}
        handle={me.username}
        initial={{
          display_name: me.display_name ?? "",
          bio: me.bio ?? "",
          avatar: me.avatar,
          avatar_path: me.avatar_path,
          diet: me.diet ?? "",
          instagram: me.instagram ?? "",
          date_of_birth: secret?.date_of_birth ?? "",
          gender: secret?.gender ?? "",
        }}
      />
    </>
  );
}
