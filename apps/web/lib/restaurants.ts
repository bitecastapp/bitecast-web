import type { SupabaseClient } from "@supabase/supabase-js";

export type Dish = { id: string; name: string; veg: boolean };
export type Restaurant = { id: string; slug: string; name: string; area: string; city: string; dishes: Dish[] };
export type DishDetail = Dish & { restaurant: Pick<Restaurant, "slug" | "name" | "area"> };

const RESTAURANT_FIELDS = "id, slug, name, area, city, dishes(id, name, veg)";

export async function getRestaurants(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("restaurants")
    .select(RESTAURANT_FIELDS)
    .order("area")
    .order("name")
    .order("name", { referencedTable: "dishes" })
    .returns<Restaurant[]>();
  if (error) throw error;
  return data;
}

export async function getRestaurant(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from("restaurants")
    .select(RESTAURANT_FIELDS)
    .eq("slug", slug)
    .order("name", { referencedTable: "dishes" })
    .maybeSingle<Restaurant>();
  if (error) throw error;
  return data;
}

export async function getDish(supabase: SupabaseClient, restaurantSlug: string, key: string) {
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, veg, restaurant:restaurants!inner(slug, name, area)")
    .eq("restaurant.slug", restaurantSlug)
    .eq("name_key", key)
    .maybeSingle<DishDetail>();
  if (error) throw error;
  return data;
}

export async function getDishById(supabase: SupabaseClient, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, veg, restaurant:restaurants(slug, name, area)")
    .eq("id", id)
    .maybeSingle<DishDetail>();
  if (error) throw error;
  return data;
}

// For "rate another dish from here": the place, and its dishes this user hasn't rated yet.
export async function getDishesToRate(supabase: SupabaseClient, userId: string, slug: string) {
  const restaurant = await getRestaurant(supabase, slug);
  if (!restaurant) return null;
  const { data, error } = await supabase
    .from("ratings")
    .select("dish_id")
    .eq("user_id", userId)
    .in("dish_id", restaurant.dishes.map((d) => d.id));
  if (error) throw error;
  const rated = new Set(data.map((r) => r.dish_id));
  return { restaurant, dishes: restaurant.dishes.filter((d) => !rated.has(d.id)) };
}
