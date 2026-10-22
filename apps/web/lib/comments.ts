import type { SupabaseClient } from "@supabase/supabase-js";

export type Comment = {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  like_count: number;
  dislike_count: number;
  author: { username: string };
};
export type CommentVote = "like" | "dislike";
export type Thread = Comment & { replies: Comment[] };

// A take's comments as threads (top-level, oldest first, each with its replies).
export async function getThreads(supabase: SupabaseClient, ratingId: string): Promise<Thread[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, body, created_at, parent_id, like_count, dislike_count, author:profiles!comments_user_id_fkey(username)")
    .eq("rating_id", ratingId)
    .order("created_at")
    .returns<Comment[]>();
  if (error) throw error;
  const threads = data.filter((c) => !c.parent_id).map((c) => ({ ...c, replies: [] as Comment[] }));
  const byId = new Map(threads.map((t) => [t.id, t]));
  for (const c of data) if (c.parent_id) byId.get(c.parent_id)?.replies.push(c);
  return threads;
}

// The viewer's own likes/dislikes on these comments (RLS only returns their own rows).
export async function getMyCommentVotes(supabase: SupabaseClient, commentIds: string[]): Promise<Record<string, CommentVote>> {
  if (!commentIds.length) return {};
  const { data, error } = await supabase.from("comment_votes").select("comment_id, kind").in("comment_id", commentIds);
  if (error) throw error;
  return Object.fromEntries(data.map((v) => [v.comment_id, v.kind as CommentVote]));
}
