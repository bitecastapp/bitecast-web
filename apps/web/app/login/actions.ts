"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validation";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email: string };

export async function sendLink(_: LoginState, formData: FormData): Promise<LoginState> {
  const raw = String(formData.get("email") ?? "");
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message, email: raw };
  }

  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    const message =
      error.status === 429
        ? "Too many links in a row. Give it a minute, then try again."
        : "Couldn't send the link just now. Try again in a moment.";
    return { status: "error", message, email: raw };
  }
  return { status: "sent", email: parsed.data };
}
