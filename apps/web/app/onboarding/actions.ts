"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { usernameSchema } from "@/lib/validation";

export type OnboardingState = {
  error?: { field: "username" | "region" | "form"; message: string };
  username?: string;
};

export async function createProfile(_: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const { supabase, userId, profile } = await getCurrentUser();
  if (profile) redirect("/");

  const rawUsername = String(formData.get("username") ?? "");
  const username = usernameSchema.safeParse(rawUsername);
  if (!username.success) {
    return { username: rawUsername, error: { field: "username", message: username.error.issues[0].message } };
  }
  const region = String(formData.get("region") ?? "");
  if (!region) {
    return { username: rawUsername, error: { field: "region", message: "Pick where home is." } };
  }

  const { error } = await supabase
    .from("profiles")
    .insert({ id: userId, username: username.data, home_region: region });

  if (error?.code === "23505" && error.message.includes("username")) {
    return { username: rawUsername, error: { field: "username", message: `@${username.data} is taken. Try another.` } };
  }
  if (error?.code === "23503") {
    return { username: rawUsername, error: { field: "region", message: "That place isn't on our list yet." } };
  }
  // 23505 on the primary key means this account already finished onboarding (double submit).
  if (error && error.code !== "23505") {
    return { username: rawUsername, error: { field: "form", message: "Couldn't save that. Try again in a moment." } };
  }
  redirect("/");
}
