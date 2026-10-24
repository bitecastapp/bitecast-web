import type { SupabaseClient } from "@supabase/supabase-js";
import { dishHref } from "./dishes";

export type NotificationKind = "agree" | "comment" | "reply" | "follow" | "dish_approved" | "dish_removed" | "take_removed" | "comment_removed";

export type Notification = {
  id: string;
  kind: NotificationKind;
  created_at: string;
  read_at: string | null;
  detail: string | null;
  actor: { username: string; avatar: string | null; avatar_path: string | null } | null;
  rating: { id: string; dish: { name: string } } | null;
  comment: { body: string } | null;
  dish: { name: string; restaurant: { slug: string } } | null;
};

const FIELDS =
  "id, kind, created_at, read_at, detail, actor:profiles!notifications_actor_id_fkey(username, avatar, avatar_path), rating:ratings(id, dish:dishes(name)), comment:comments(body), dish:dishes(name, restaurant:restaurants(slug))";

// shortcut: the latest 60 only; add paging if people pile up more than that between visits.
export async function getNotifications(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select(FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60)
    .returns<Notification[]>();
  if (error) throw error;
  return data;
}

export async function unreadCount(supabase: SupabaseClient, userId: string) {
  const { count, error } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

const snippet = (s: string) => (s.length > 70 ? `${s.slice(0, 68).trimEnd()}…` : s);

// What a notification says and where it leads. `who` is null for moderation notices (from Nomrank).
export function describe(n: Notification): { who: string | null; text: string; quote: string | null; href: string | null } {
  const who = n.actor ? `@${n.actor.username}` : null;
  const dish = n.rating?.dish.name ?? n.dish?.name ?? n.detail ?? "a dish";
  const take = n.rating ? `/review/${n.rating.id}` : null;
  switch (n.kind) {
    case "agree":
      return { who, text: `agreed with your take on ${dish}`, quote: null, href: take };
    case "comment":
      return { who, text: `commented on your take on ${dish}`, quote: n.comment ? snippet(n.comment.body) : null, href: take && `${take}#comments` };
    case "reply":
      return { who, text: `replied to your comment on ${dish}`, quote: n.comment ? snippet(n.comment.body) : null, href: take && `${take}#comments` };
    case "follow":
      return { who, text: "started following you", quote: null, href: n.actor ? `/u/${n.actor.username}` : null };
    case "dish_approved":
      return { who: null, text: `${dish} is approved and live for everyone`, quote: null, href: n.dish ? dishHref(n.dish.restaurant.slug, n.dish.name) : null };
    case "dish_removed":
      return { who: null, text: `${dish} was removed in review. It may have been a duplicate or not on the menu`, quote: null, href: "/about#guidelines" };
    case "take_removed":
      return { who: null, text: `Your take on ${dish} was removed for going against our community guidelines`, quote: null, href: "/about#guidelines" };
    case "comment_removed":
      return { who: null, text: `Your comment on ${dish} was removed for going against our community guidelines`, quote: null, href: "/about#guidelines" };
  }
}
