import { cacheLife } from "next/cache";
import { createPublicClient } from "./supabase/public";
import { keyFromDishSlug } from "./dishes";
import { photoUrl } from "./ratings";

// Public facts behind link previews and page titles, cached for a few minutes so a burst of shares doesn't hit the
// database each time. Everything here is what a signed-out visitor could see anyway.

export type ShareDish = { name: string; place: string; area: string; avg: number | null; count: number; photo: string | null };
export type ShareTake = { dish: string; place: string; author: string; score: number; take: string; photo: string | null };
export type ShareList = { name: string; top: { name: string; place: string }[]; count: number };
export type ShareProfile = { handle: string; name: string | null; bio: string | null; rated: number; average: number | null };

export async function shareDish(restaurantSlug: string, dishSlug: string): Promise<ShareDish | null> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("dishes")
    .select("name, avg_score, rating_count, restaurant:restaurants!inner(slug, name, area), ratings(rating_photos(path))")
    .eq("restaurant.slug", restaurantSlug)
    .eq("name_key", keyFromDishSlug(decodeURIComponent(dishSlug)))
    .limit(20, { referencedTable: "ratings" }) // enough to find a photo without pulling every rating
    .maybeSingle<{ name: string; avg_score: number | null; rating_count: number; restaurant: { name: string; area: string }; ratings: { rating_photos: { path: string }[] }[] }>();
  if (!data) return null;
  const path = data.ratings.flatMap((r) => r.rating_photos)[0]?.path;
  return {
    name: data.name,
    place: data.restaurant.name,
    area: data.restaurant.area,
    avg: data.avg_score === null ? null : Number(data.avg_score),
    count: data.rating_count,
    photo: path ? photoUrl(path) : null,
  };
}

export async function shareTake(id: string): Promise<ShareTake | null> {
  "use cache";
  cacheLife("minutes");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("ratings")
    .select("score, take, author:profiles!ratings_user_id_fkey(username), dish:dishes!inner(name, restaurant:restaurants(name)), photos:rating_photos(path, position)")
    .eq("id", id)
    .not("take", "is", null)
    .maybeSingle<{ score: number; take: string; author: { username: string }; dish: { name: string; restaurant: { name: string } }; photos: { path: string; position: number }[] }>();
  if (!data) return null;
  const first = [...data.photos].sort((a, b) => a.position - b.position)[0];
  return { dish: data.dish.name, place: data.dish.restaurant.name, author: data.author.username, score: Number(data.score), take: data.take, photo: first ? photoUrl(first.path) : null };
}

export async function shareList(slug: string): Promise<ShareList | null> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data: list } = await supabase.from("spaces").select("id, name").eq("name_key", keyFromDishSlug(decodeURIComponent(slug))).maybeSingle();
  if (!list) return null;
  const { data: ranked } = await supabase.from("dish_rankings").select("dish_id, rank").eq("space_id", list.id).not("rank", "is", null).order("rank").limit(3);
  const ids = (ranked ?? []).map((r) => r.dish_id as string);
  const { data: dishes } = ids.length
    ? await supabase.from("dishes").select("id, name, restaurant:restaurants(name)").in("id", ids).returns<{ id: string; name: string; restaurant: { name: string } }[]>()
    : { data: [] };
  const { count } = await supabase.from("dishes").select("*", { count: "exact", head: true }).eq("space_id", list.id);
  const byId = new Map((dishes ?? []).map((d) => [d.id, d]));
  return {
    name: list.name as string,
    top: ids.flatMap((id) => (byId.has(id) ? [{ name: byId.get(id)!.name, place: byId.get(id)!.restaurant.name }] : [])),
    count: count ?? 0,
  };
}

export async function shareProfile(handle: string): Promise<ShareProfile | null> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data } = await supabase.from("profiles").select("id, username, display_name, bio").eq("username", decodeURIComponent(handle).toLowerCase()).maybeSingle();
  if (!data) return null;
  const { data: stats } = await supabase.rpc("profile_stats", { profile_id: data.id }).single<{ rated: number; average: string | null }>();
  return {
    handle: data.username as string,
    name: (data.display_name as string | null) ?? null,
    bio: (data.bio as string | null) ?? null,
    rated: stats?.rated ?? 0,
    average: stats?.average == null ? null : Number(stats.average),
  };
}
