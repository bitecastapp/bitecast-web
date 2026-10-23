import type { SupabaseClient } from "@supabase/supabase-js";
import type { DishDiet } from "./diet";
import { dishKey } from "./dishes";
import type { ReportTarget } from "./validation";

// Admin data. The database decides what an admin can read (RLS + is_admin()); these only shape it for the screens.

export async function isAdmin(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  return data === true;
}

export async function getAdminCounts(supabase: SupabaseClient) {
  const head = { count: "exact" as const, head: true };
  const [pending, reports, banned, people] = await Promise.all([
    supabase.from("dishes").select("*", head).is("approved_at", null),
    supabase.from("reports").select("*", head).is("resolved_at", null),
    supabase.from("profiles").select("*", head).not("banned_at", "is", null),
    supabase.from("profiles").select("*", head),
  ]);
  for (const r of [pending, reports, banned, people]) if (r.error) throw r.error;
  return { pending: pending.count ?? 0, reports: reports.count ?? 0, banned: banned.count ?? 0, people: people.count ?? 0 };
}

const handlesOf = async (supabase: SupabaseClient, ids: string[]) => {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map<string, string>();
  const { data, error } = await supabase.from("profiles").select("id, username").in("id", unique);
  if (error) throw error;
  return new Map(data.map((p) => [p.id as string, p.username as string]));
};

export type PendingDish = {
  id: string;
  name: string;
  diet: DishDiet;
  created_at: string;
  created_by: string | null;
  restaurant: { id: string; slug: string; name: string; area: string; dishes: { name: string; approved_at: string | null }[] };
  by: string | null; // creator's handle
  similar: string[]; // approved dishes at the same place sharing a word with this one: likely duplicates
};

// The approval queue, oldest first, with likely duplicates already on that menu.
export async function getPendingDishes(supabase: SupabaseClient): Promise<PendingDish[]> {
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, diet, created_at, created_by, restaurant:restaurants(id, slug, name, area, dishes(name, approved_at))")
    .is("approved_at", null)
    .order("created_at")
    .limit(100)
    .returns<Omit<PendingDish, "by" | "similar">[]>();
  if (error) throw error;
  const handles = await handlesOf(supabase, data.map((d) => d.created_by ?? ""));
  return data.map((d) => ({ ...d, by: d.created_by ? (handles.get(d.created_by) ?? null) : null, similar: similarNames(d.name, d.restaurant.dishes) }));
}

// Approved dishes whose names share a word (3+ letters) with `name`.
export function similarNames(name: string, menu: { name: string; approved_at: string | null }[]) {
  const words = new Set(dishKey(name).split(" ").filter((w) => w.length >= 3));
  return menu.filter((m) => m.approved_at && dishKey(m.name).split(" ").some((w) => words.has(w))).map((m) => m.name);
}

type ReportRow = { id: string; target_type: ReportTarget; target_id: string; reason: string; note: string | null; created_at: string; reporter_id: string };

export type ReportGroup = {
  target_type: ReportTarget;
  target_id: string;
  reports: (ReportRow & { by: string | null })[];
  latest: string;
  // What was reported, as it is now (null if it's already gone).
  target: { text: string; context: string; href: string | null; author_id: string | null; author: string | null } | null;
};

// Open reports grouped by the thing reported, most-reported first, then newest.
export async function getOpenReports(supabase: SupabaseClient): Promise<ReportGroup[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, target_type, target_id, reason, note, created_at, reporter_id")
    .is("resolved_at", null)
    .order("created_at", { ascending: false })
    .limit(300)
    .returns<ReportRow[]>();
  if (error) throw error;

  const ids = (type: ReportTarget) => [...new Set(data.filter((r) => r.target_type === type).map((r) => r.target_id))];
  const [ratings, comments, dishes] = await Promise.all([
    ids("rating").length
      ? supabase.from("ratings").select("id, score, take, user_id, dish:dishes(name, restaurant:restaurants(slug, name))").in("id", ids("rating"))
      : { data: [], error: null },
    ids("comment").length ? supabase.from("comments").select("id, body, user_id, rating_id").in("id", ids("comment")) : { data: [], error: null },
    ids("dish").length
      ? supabase.from("dishes").select("id, name, created_by, restaurant:restaurants(slug, name)").in("id", ids("dish"))
      : { data: [], error: null },
  ]);
  for (const r of [ratings, comments, dishes]) if (r.error) throw r.error;

  type T = NonNullable<ReportGroup["target"]>;
  const targets = new Map<string, Omit<T, "author">>();
  for (const r of (ratings.data ?? []) as unknown as { id: string; score: number; take: string | null; user_id: string; dish: { name: string; restaurant: { slug: string; name: string } } | null }[])
    targets.set(r.id, { text: r.take ?? `Score only: ${r.score}`, context: r.dish ? `${r.score}/10 for ${r.dish.name} at ${r.dish.restaurant.name}` : `${r.score}/10`, href: `/review/${r.id}`, author_id: r.user_id });
  for (const c of (comments.data ?? []) as { id: string; body: string; user_id: string; rating_id: string }[])
    targets.set(c.id, { text: c.body, context: "Comment", href: `/review/${c.rating_id}#comments`, author_id: c.user_id });
  for (const d of (dishes.data ?? []) as unknown as { id: string; name: string; created_by: string | null; restaurant: { slug: string; name: string } }[])
    targets.set(d.id, { text: d.name, context: `Dish at ${d.restaurant.name}`, href: `/r/${d.restaurant.slug}/${encodeURIComponent(dishKey(d.name).replaceAll(" ", "-"))}`, author_id: d.created_by });

  const handles = await handlesOf(supabase, [...data.map((r) => r.reporter_id), ...[...targets.values()].map((t) => t.author_id ?? "")]);
  const groups = new Map<string, ReportGroup>();
  for (const r of data) {
    const key = `${r.target_type}:${r.target_id}`;
    const t = targets.get(r.target_id);
    const g = groups.get(key) ?? {
      target_type: r.target_type,
      target_id: r.target_id,
      reports: [],
      latest: r.created_at,
      target: t ? { ...t, author: t.author_id ? (handles.get(t.author_id) ?? null) : null } : null,
    };
    g.reports.push({ ...r, by: handles.get(r.reporter_id) ?? null });
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.reports.length - a.reports.length || b.latest.localeCompare(a.latest));
}

export type AdminPerson = { id: string; username: string; display_name: string | null; created_at: string; banned_at: string | null; ratings: number; comments: number };

// People by handle (or the newest when there's no search), with how much they've posted.
export async function findPeople(supabase: SupabaseClient, q: string): Promise<AdminPerson[]> {
  let query = supabase.from("profiles").select("id, username, display_name, created_at, banned_at, ratings!ratings_user_id_fkey(count), comments!comments_user_id_fkey(count)");
  const handle = q.trim().replace(/^@/, "").toLowerCase();
  query = handle ? query.ilike("username", `%${handle.replace(/[%_\\]/g, "\\$&")}%`) : query.order("created_at", { ascending: false });
  const { data, error } = await query.limit(30).returns<(Omit<AdminPerson, "ratings" | "comments"> & { ratings: { count: number }[]; comments: { count: number }[] })[]>();
  if (error) throw error;
  return data.map(({ ratings, comments, ...p }) => ({ ...p, ratings: ratings[0]?.count ?? 0, comments: comments[0]?.count ?? 0 }));
}

export type LogEntry = { id: number; action: string; target_type: string; target_id: string | null; detail: Record<string, unknown> | null; created_at: string; admin: string | null };

export async function getModerationLog(supabase: SupabaseClient): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from("moderation_log")
    .select("id, action, target_type, target_id, detail, created_at, admin_id")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  const handles = await handlesOf(supabase, data.map((l) => (l.admin_id as string) ?? ""));
  return data.map(({ admin_id, ...l }) => ({ ...(l as Omit<LogEntry, "admin">), admin: admin_id ? (handles.get(admin_id as string) ?? null) : null }));
}
