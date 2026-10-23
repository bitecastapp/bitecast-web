"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { preferencesSchema, privacySchema } from "@/lib/validation";

export type DeleteAccountState = { error?: string };

// Delete your account for good. You confirm by typing your handle. Your photo files go first (Storage isn't part of
// the database cascade), then the database removes the account and everything that hangs off it.
export async function deleteAccount(_: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const { supabase, userId, profile } = await getCurrentUser({ allowSuspended: true });
  if (!profile) redirect("/onboarding");
  const typed = String(formData.get("confirm") ?? "").trim().replace(/^@/, "").toLowerCase();
  if (typed !== profile.username) return { error: `Type ${profile.username} to confirm.` };

  for (const bucket of ["rating-photos", "avatars"]) {
    // shortcut: removes up to 1000 files per bucket; page through them if anyone ever uploads more.
    const { data: files } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
    const paths = (files ?? []).map((f) => `${userId}/${f.name}`);
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: "Couldn't delete your account just now. Try again in a moment." };

  await supabase.auth.signOut();
  redirect("/?account=deleted");
}

export type PreferencesState = { error?: string; saved?: number };

// Which dishes to show and which feed opens first. Stored with your private details (owner-only).
export async function savePreferences(prev: PreferencesState, formData: FormData): Promise<PreferencesState> {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const parsed = preferencesSchema.safeParse({ show_diet: formData.get("show_diet"), feed_default: formData.get("feed_default") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // user_id fills itself from the session (only these columns are writable).
  const { error } = await supabase.from("profile_private").upsert(parsed.data, { onConflict: "user_id" });
  if (error) return { error: "Couldn't save that just now. Try again in a moment." };
  refresh();
  return { saved: (prev.saved ?? 0) + 1 }; // a new number each time, so the form can say "Saved"
}

export type PrivacyState = { error?: string; saved?: number };

// Who can see your "Want to try" list and Diary. Stored on your profile; the database enforces Want to try.
export async function savePrivacy(prev: PrivacyState, formData: FormData): Promise<PrivacyState> {
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const parsed = privacySchema.safeParse({ saves_visibility: formData.get("saves_visibility"), diary_visibility: formData.get("diary_visibility") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  if (error) return { error: "Couldn't save that just now. Try again in a moment." };
  refresh();
  return { saved: (prev.saved ?? 0) + 1 };
}
