"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { favouritesSchema } from "@/lib/validation";

// Follow or unfollow. The database blocks following yourself or following on someone else's behalf.
export async function setFollow(followeeId: string, follow: boolean) {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  if (follow) {
    const { error } = await supabase.from("follows").insert({ followee_id: followeeId });
    if (error && error.code !== "23505") throw error; // already following is fine
  } else {
    await supabase.from("follows").delete().eq("followee_id", followeeId);
  }
  refresh();
}

// Replace your pinned favourites (rating ids, in order). Returns an error message, or null when saved.
export async function saveFavourites(ratingIds: string[]): Promise<string | null> {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const ids = favouritesSchema.safeParse(ratingIds);
  if (!ids.success) return ids.error.issues[0].message;
  const { error } = await supabase.rpc("set_favourites", { rating_ids: ids.data });
  if (error) return "Couldn't pin those just now. Try again in a moment.";
  refresh();
  return null;
}

// Add a dish to, or take it off, your "Want to try" list.
export async function setSaved(dishId: string, saved: boolean) {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  if (saved) {
    const { error } = await supabase.from("saves").insert({ dish_id: dishId });
    if (error && error.code !== "23505") throw error; // already saved is fine
  } else {
    await supabase.from("saves").delete().eq("dish_id", dishId);
  }
  refresh();
}
