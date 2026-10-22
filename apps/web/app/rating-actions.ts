"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { dishHref } from "@/lib/dishes";
import type { Vote } from "@/lib/ratings";
import { ratingSchema } from "@/lib/validation";

export type SaveRatingState = { error?: string };

// Create or update the viewer's one rating of a dish. Photos, when sent, replace the old set.
export async function saveRating(_: SaveRatingState, formData: FormData): Promise<SaveRatingState> {
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  const dishId = String(formData.get("dish_id") ?? "");
  const parsed = ratingSchema.safeParse({ score: formData.get("score"), take: String(formData.get("take") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const photosSent = formData.get("photos_sent") === "1";
  const paths = formData.getAll("photo").map(String).filter((p) => p.startsWith(`${userId}/`)).slice(0, 4);

  const { data: existing } = await supabase.from("ratings").select("id").eq("dish_id", dishId).eq("user_id", userId).maybeSingle();
  const { data: saved, error } = existing
    ? await supabase.from("ratings").update(parsed.data).eq("id", existing.id).select("id").single()
    : await supabase.from("ratings").insert({ dish_id: dishId, ...parsed.data }).select("id").single();
  if (error || !saved) return { error: "Couldn't save that just now. Try again in a moment." };

  if (photosSent) {
    const { data: old } = await supabase.from("rating_photos").select("path").eq("rating_id", saved.id);
    await supabase.from("rating_photos").delete().eq("rating_id", saved.id);
    const gone = (old ?? []).map((p) => p.path).filter((p) => !paths.includes(p));
    if (gone.length) await supabase.storage.from("rating-photos").remove(gone);
    if (paths.length) {
      const { error: photoError } = await supabase
        .from("rating_photos")
        .insert(paths.map((path, i) => ({ rating_id: saved.id, path, position: i + 1 })));
      if (photoError) return { error: "Saved your score, but the photos didn't attach. Try adding them again." };
    }
  }

  if (parsed.data.take) redirect(`/review/${saved.id}`);
  const { data: dish } = await supabase.from("dishes").select("name, restaurant:restaurants(slug)").eq("id", dishId).single<{ name: string; restaurant: { slug: string } }>();
  redirect(dish ? dishHref(dish.restaurant.slug, dish.name) : "/");
}

// Facts / Cap / clear. The database blocks self-votes and keeps the counts.
export async function castVote(ratingId: string, kind: Vote | null) {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  if (!kind) {
    await supabase.from("votes").delete().eq("rating_id", ratingId);
    return;
  }
  const { data } = await supabase.from("votes").update({ kind }).eq("rating_id", ratingId).select("rating_id");
  if (!data?.length) await supabase.from("votes").insert({ rating_id: ratingId, kind });
}
