import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  username: string;
  home_region: string;
  regions: { name: string; demonym: string } | null;
};

// The one place pages read the signed-in user. Signed out → /login.
export async function getCurrentUser() {
  // Session checks read the clock (token expiry), so keep them out of prerendering.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, home_region, regions(name, demonym)")
    .eq("id", userId)
    .maybeSingle<Profile>();
  if (error) throw error;

  return { supabase, userId, profile };
}
