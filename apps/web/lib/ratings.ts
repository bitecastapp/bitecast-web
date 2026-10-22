import type { SupabaseClient } from "@supabase/supabase-js";

export type Vote = "facts" | "cap";
export type Review = {
  id: string;
  score: number;
  take: string | null;
  facts_count: number;
  cap_count: number;
  created_at: string;
  author: { username: string };
  dish: { name: string; restaurant: { slug: string; name: string; area: string } };
  photos: { path: string; position: number }[];
};
export type Sort = "top" | "new";

const REVIEW_FIELDS =
  "id, score, take, facts_count, cap_count, created_at, author:profiles!ratings_user_id_fkey(username), dish:dishes(name, restaurant:restaurants(slug, name, area)), photos:rating_photos(path, position)";

// Public URL for a stored photo (the bucket is public-read).
export function photoUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rating-photos/${path}`;
}

function sorted<T extends { photos: { position: number }[] }>(rows: T[]) {
  for (const r of rows) r.photos.sort((a, b) => a.position - b.position);
  return rows;
}

// The home feed: reviews (ratings with a take), Top = net votes, New = newest.
export async function getFeed(supabase: SupabaseClient, sort: Sort, limit = 30) {
  let q = supabase.from("ratings").select(REVIEW_FIELDS).not("take", "is", null);
  q = sort === "top" ? q.order("net_votes", { ascending: false }).order("created_at", { ascending: false }) : q.order("created_at", { ascending: false });
  const { data, error } = await q.limit(limit).returns<Review[]>();
  if (error) throw error;
  return sorted(data);
}

// Every rating of one dish (scores for the average and spread; reviews for the list).
export async function getDishRatings(supabase: SupabaseClient, dishId: string) {
  const { data, error } = await supabase
    .from("ratings")
    .select(REVIEW_FIELDS)
    .eq("dish_id", dishId)
    .order("net_votes", { ascending: false })
    .returns<Review[]>();
  if (error) throw error;
  return sorted(data);
}

export async function getReview(supabase: SupabaseClient, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.from("ratings").select(REVIEW_FIELDS).eq("id", id).maybeSingle<Review>();
  if (error) throw error;
  return data && sorted([data])[0];
}

// The viewer's own votes on a set of reviews (votes are private, so this only ever returns theirs).
export async function getMyVotes(supabase: SupabaseClient, ratingIds: string[]) {
  if (!ratingIds.length) return {};
  const { data, error } = await supabase.from("votes").select("rating_id, kind").in("rating_id", ratingIds);
  if (error) throw error;
  return Object.fromEntries(data.map((v) => [v.rating_id, v.kind as Vote])) as Record<string, Vote>;
}

export function summarize(scores: number[]) {
  const count = scores.length;
  const average = count ? scores.reduce((a, b) => a + b, 0) / count : null;
  const spread = Array.from({ length: 10 }, (_, i) => scores.filter((s) => s === i + 1).length);
  return { count, average, spread };
}
