import { createClient } from "@supabase/supabase-js";

// A signed-out client with no cookies, for public data that can be cached and shared: link previews and page
// titles. It sees exactly what any visitor sees (RLS as anon).
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
