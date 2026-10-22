import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  username: string;
  home_region: string;
  regions: { name: string; demonym: string } | null;
};

// For public pages: the viewer may be signed out (userId null). Signed in without a profile → /onboarding.
export async function getViewer() {
  // Session checks read the clock (token expiry), so keep them out of prerendering.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub ?? null;
  if (!userId) return { supabase, userId, profile: null };

  const profile = await getProfile(supabase, userId);
  if (!profile) redirect("/onboarding");
  return { supabase, userId, profile };
}

// For pages that need a session. Signed out → /login. The profile may be missing (onboarding).
export async function getCurrentUser() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login");
  return { supabase, userId, profile: await getProfile(supabase, userId) };
}

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, home_region, regions(name, demonym)")
    .eq("id", userId)
    .maybeSingle<Profile>();
  if (error) throw error;
  return profile;
}
