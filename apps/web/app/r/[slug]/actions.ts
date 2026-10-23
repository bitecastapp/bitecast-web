"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { friendlyError } from "@/lib/db-errors";
import { dishHref, dishKey } from "@/lib/dishes";
import { dishNameSchema } from "@/lib/validation";

export type AddDishState = { error?: string; existing?: { id: string; name: string }; name?: string };

export async function addDish(_: AddDishState, formData: FormData): Promise<AddDishState> {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  const restaurantId = String(formData.get("restaurant_id") ?? "");
  const raw = String(formData.get("name") ?? "");
  const name = dishNameSchema.safeParse(raw);
  if (!name.success) return { name: raw, error: name.error.issues[0].message };
  const diet = formData.get("diet");
  if (diet !== "veg" && diet !== "vegan" && diet !== "egg" && diet !== "non_veg") return { name: raw, error: "Pick veg, vegan, egg or non-veg." };

  const { data, error } = await supabase
    .from("dishes")
    .insert({ restaurant_id: restaurantId, name: name.data, diet })
    .select("name, approved_at, restaurant:restaurants(slug)")
    .single<{ name: string; approved_at: string | null; restaurant: { slug: string } }>();

  if (error?.code === "23505") {
    const { data: existing } = await supabase
      .from("dishes")
      .select("id, name")
      .eq("restaurant_id", restaurantId)
      .eq("name_key", dishKey(name.data))
      .maybeSingle();
    return { name: raw, error: "That one's already on the menu.", existing: existing ?? undefined };
  }
  if (error) return { name: raw, error: friendlyError(error, "Couldn't add that just now. Try again in a moment.") };

  // New dishes wait for an admin's approval (admins' own go live); the toast says which.
  redirect(`${dishHref(data.restaurant.slug, data.name)}?done=${data.approved_at ? "dish-live" : "dish-pending"}`);
}
