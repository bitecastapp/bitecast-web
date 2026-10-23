import { createClient } from "@/lib/supabase/server";

// "Download my data": everything Bitecast keeps about you, as one JSON file. Read as you, so RLS decides what's
// included (your private details, your own votes and reports, and your public rows).
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return new Response("Sign in to download your data.", { status: 401 });

  const mine = <T extends string>(table: T, columns: string, owner = "user_id") => supabase.from(table).select(columns).eq(owner, userId);
  const results = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("profile_private").select("*").eq("user_id", userId).maybeSingle(),
    mine("ratings", "id, score, take, created_at, updated_at, dish:dishes(name, restaurant:restaurants(name)), photos:rating_photos(path)"),
    mine("comments", "id, rating_id, parent_id, body, created_at"),
    mine("votes", "rating_id, kind, created_at"),
    mine("comment_votes", "comment_id, kind"),
    mine("saves", "created_at, dish:dishes(name, restaurant:restaurants(name))"),
    mine("favourites", "position, rating_id"),
    mine("follows", "followee:profiles!follows_followee_id_fkey(username), created_at", "follower_id"),
    mine("reports", "target_type, target_id, reason, note, created_at", "reporter_id"),
    mine("notifications", "kind, detail, created_at, read_at"),
  ]);
  const failed = results.find((r) => r.error);
  if (failed) return new Response("Couldn't gather your data just now. Try again in a moment.", { status: 500 });

  const [profile, details, ratings, comments, votes, commentVotes, saves, favourites, following, reports, notifications] = results.map((r) => r.data);
  const body = JSON.stringify(
    { exported_at: new Date().toISOString(), profile, private_details: details, ratings, comments, votes, comment_votes: commentVotes, want_to_try: saves, favourites, following, reports, notifications },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bitecast-my-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
