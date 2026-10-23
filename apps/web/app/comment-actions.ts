"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { friendlyError } from "@/lib/db-errors";
import type { CommentVote } from "@/lib/comments";
import { commentSchema } from "@/lib/validation";

export type CommentState = { error?: string; ok?: number };

export async function addComment(prev: CommentState, formData: FormData): Promise<CommentState> {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  const body = commentSchema.safeParse(String(formData.get("body") ?? ""));
  if (!body.success) return { error: body.error.issues[0].message };
  const parentId = String(formData.get("parent_id") ?? "") || null;

  const { error } = await supabase
    .from("comments")
    .insert({ rating_id: String(formData.get("rating_id") ?? ""), parent_id: parentId, body: body.data });
  if (error) return { error: friendlyError(error, "Couldn't post that just now. Try again in a moment.") };

  refresh();
  return { ok: (prev.ok ?? 0) + 1 }; // a new number each success, so the form knows to clear
}

export async function deleteComment(id: string) {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  await supabase.from("comments").delete().eq("id", id);
  refresh();
}

// Like / dislike / clear. The database blocks voting on your own comment and keeps the counts.
export async function castCommentVote(commentId: string, kind: CommentVote | null) {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  if (!kind) {
    await supabase.from("comment_votes").delete().eq("comment_id", commentId);
  } else {
    const { data } = await supabase.from("comment_votes").update({ kind }).eq("comment_id", commentId).select("comment_id");
    if (!data?.length) await supabase.from("comment_votes").insert({ comment_id: commentId, kind });
  }
  refresh();
}
