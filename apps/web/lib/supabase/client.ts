import { createBrowserClient } from "@supabase/ssr";

// Browser client: used only for photo uploads (Storage); everything else goes through Server Actions.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
