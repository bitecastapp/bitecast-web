"use server";

import { after } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { emailSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/email";
import { waitlistEmail } from "@/lib/waitlist-email";

export type WaitlistState = { error?: string; joined?: boolean; email?: string };

// Add an email to the waitlist. Already on it counts as joined (and doesn't reveal who signed up).
// `website` is a honeypot: hidden from people, so only bots fill it in; they get a fake success.
export async function joinWaitlist(_: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const raw = String(formData.get("email") ?? "");
  if (formData.get("website")) return { joined: true };
  const email = emailSchema.safeParse(raw);
  if (!email.success) return { error: email.error.issues[0].message, email: raw };

  const { error } = await createPublicClient().from("waitlist").insert({ email: email.data });
  if (error && error.code !== "23505") return { error: "Couldn't add you just now. Try again in a moment.", email: raw };

  // First time on the list: send the welcome email once the response is out, so the form stays instant.
  // A failed send is logged, not shown: the signup itself worked.
  if (!error) {
    after(async () => {
      try {
        await sendEmail({ to: email.data, ...waitlistEmail(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nomrank.in") });
      } catch (e) {
        console.error("[waitlist] welcome email failed", e);
      }
    });
  }
  return { joined: true };
}
