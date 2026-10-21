"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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

  const { data, error } = await supabase
    .from("dishes")
    .insert({ restaurant_id: restaurantId, name: name.data })
    .select("name, restaurant:restaurants(slug)")
    .single<{ name: string; restaurant: { slug: string } }>();

  if (error?.code === "23505") {
    const { data: existing } = await supabase
      .from("dishes")
      .select("id, name")
      .eq("restaurant_id", restaurantId)
      .eq("name_key", dishKey(name.data))
      .maybeSingle();
    return { name: raw, error: "That one's already on the menu.", existing: existing ?? undefined };
  }
  if (error) return { name: raw, error: "Couldn't add that just now. Try again in a moment." };

  redirect(dishHref(data.restaurant.slug, data.name));
}
