import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangleIcon,
  ClipboardListIcon,
  FlagIcon,
  LayoutDashboardIcon,
  SearchIcon,
  ShieldCheckIcon,
  StoreIcon,
  UsersRoundIcon,
  UtensilsIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { findPeople, getAdminCounts, getModerationLog, getOpenReports, getPendingDishes, isAdmin, type LogEntry } from "@/lib/admin";
import { dishHref } from "@/lib/dishes";
import { getRestaurants } from "@/lib/restaurants";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { REPORT_REASONS } from "@/lib/validation";
import { BackLink } from "@/components/back-link";
import { DietMark } from "@/components/diet-mark";
import { PageLoader } from "@/components/loader";
import { PageShell } from "@/components/page-shell";
import { Input } from "@/components/ui/input";
import { approveDish, dismissReports, removeContent } from "./actions";
import { ActionButton, AddRestaurantForm, BanControls } from "./controls";

export const metadata: Metadata = { title: "Admin · Nomrank", robots: { index: false } };

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboardIcon },
  { key: "dishes", label: "Dishes", icon: UtensilsIcon },
  { key: "reports", label: "Reports", icon: FlagIcon },
  { key: "restaurants", label: "Restaurants", icon: StoreIcon },
  { key: "people", label: "People", icon: UsersRoundIcon },
  { key: "log", label: "Log", icon: ClipboardListIcon },
] as const;
type Tab = (typeof TABS)[number]["key"];

const OVERLINE = "text-xs font-semibold tracking-[0.08em] text-faint uppercase";
const CARD = "rounded-2xl border border-hairline bg-paper p-4 sm:p-5";
const WHAT = { rating: "Take", comment: "Comment", dish: "Dish" } as const;

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <PageShell wide>
      <Suspense fallback={<PageLoader />}>
        <Admin searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

async function Admin({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const { supabase } = await getCurrentUser();
  // Not an admin: the page doesn't exist for you (the database refuses the actions regardless).
  if (!(await isAdmin(supabase))) notFound();
  const params = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === params.tab) ? (params.tab as Tab) : "overview";
  const q = typeof params.q === "string" ? params.q : "";
  const counts = await getAdminCounts(supabase);
  const badge: Partial<Record<Tab, number>> = { dishes: counts.pending, reports: counts.reports };

  return (
    <div className="pb-10">
      <BackLink href="/" />
      <h1 className="mt-2 flex items-center gap-2 text-2xl leading-tight font-bold tracking-tight">
        <ShieldCheckIcon aria-hidden className="size-6 text-mustard" />
        Admin
      </h1>

      <nav aria-label="Admin sections" className="mt-4 flex gap-1 overflow-x-auto border-b border-hairline [scrollbar-width:none]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={key === "overview" ? "/admin" : `/admin?tab=${key}`}
            replace
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "relative -mb-px inline-flex min-h-11 shrink-0 items-center gap-1.5 px-2.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              tab === key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" />
            {label}
            {badge[key] ? <span className="rounded-full bg-ketchup px-1.5 text-[0.6875rem] text-studio tabular-nums">{badge[key]}</span> : null}
            {tab === key && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-mustard" />}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "overview" ? (
          <Overview counts={counts} log={(await getModerationLog(supabase)).slice(0, 8)} />
        ) : tab === "dishes" ? (
          <Dishes dishes={await getPendingDishes(supabase)} />
        ) : tab === "reports" ? (
          <Reports groups={await getOpenReports(supabase)} />
        ) : tab === "restaurants" ? (
          <Restaurants restaurants={await getRestaurants(supabase)} />
        ) : tab === "people" ? (
          <People q={q} people={await findPeople(supabase, q)} />
        ) : (
          <Log entries={await getModerationLog(supabase)} />
        )}
      </div>
    </div>
  );
}

function Overview({ counts, log }: { counts: Awaited<ReturnType<typeof getAdminCounts>>; log: LogEntry[] }) {
  const stats = [
    { label: "Dishes to review", value: counts.pending, href: "/admin?tab=dishes", icon: UtensilsIcon, urgent: counts.pending > 0 },
    { label: "Open reports", value: counts.reports, href: "/admin?tab=reports", icon: FlagIcon, urgent: counts.reports > 0 },
    { label: "Banned accounts", value: counts.banned, href: "/admin?tab=people", icon: AlertTriangleIcon, urgent: false },
    { label: "People", value: counts.people, href: "/admin?tab=people", icon: UsersRoundIcon, urgent: false },
  ];
  return (
    <div className="flex flex-col gap-8">
      <ul className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon, urgent }) => (
          <li key={label}>
            <Link href={href} className={cn(CARD, "flex flex-col gap-2 transition-colors hover:border-input", urgent && "border-ketchup/50")}>
              <Icon aria-hidden className={cn("size-5", urgent ? "text-ketchup" : "text-mustard")} />
              <span className="text-3xl font-bold tabular-nums">{value}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section aria-labelledby="recent">
        <h2 id="recent" className={OVERLINE}>
          Recent admin actions
        </h2>
        <LogList entries={log} />
      </section>
    </div>
  );
}

function Dishes({ dishes }: { dishes: Awaited<ReturnType<typeof getPendingDishes>> }) {
  if (!dishes.length) return <Empty icon={UtensilsIcon}>No dishes waiting. New ones people add show up here.</Empty>;
  return (
    <ul className="stagger grid gap-3 lg:grid-cols-2">
      {dishes.map((d) => (
        <li key={d.id} className={CARD}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={dishHref(d.restaurant.slug, d.name)} className="flex items-center gap-1.5 font-semibold hover:underline">
                <DietMark diet={d.diet} className="size-3 shrink-0" />
                <span className="wrap-anywhere">{d.name}</span>
              </Link>
              <p className="mt-0.5 text-sm text-muted-foreground wrap-anywhere">
                {d.restaurant.name}, {d.restaurant.area}
              </p>
              <p className="mt-1 text-xs text-faint">
                Added {d.by ? <Link href={`/u/${d.by}`} className="font-semibold text-muted-foreground hover:underline">by @{d.by}</Link> : "by a deleted account"} ·{" "}
                {timeAgo(d.created_at)}
              </p>
            </div>
          </div>
          {d.similar.length > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-mustard/10 px-3 py-2 text-sm">
              <AlertTriangleIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-mustard" />
              <span>Possible duplicate. Already on this menu: {d.similar.join(", ")}</span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton run={approveDish} args={[d.id]} label="Approve" icon="approve" done={`${d.name} is live`} tone="primary" />
            <ActionButton run={removeContent} args={["dish", d.id, "Rejected in review"]} label="Remove" icon="remove" done="Dish removed" confirm="Remove this dish and its ratings?" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Reports({ groups }: { groups: Awaited<ReturnType<typeof getOpenReports>> }) {
  if (!groups.length) return <Empty icon={FlagIcon}>No open reports. All clear.</Empty>;
  return (
    <ul className="stagger flex flex-col gap-3">
      {groups.map((g) => {
        const reasons = Map.groupBy(g.reports, (r) => r.reason);
        const label = (value: string) => REPORT_REASONS[g.target_type].find((r) => r.value === value)?.label ?? value;
        return (
          <li key={`${g.target_type}:${g.target_id}`} className={CARD}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-raised px-2 py-0.5 font-semibold">{WHAT[g.target_type]}</span>
              <span className="font-semibold text-ketchup">
                {g.reports.length} {g.reports.length === 1 ? "report" : "reports"}
              </span>
              <span className="text-faint">latest {timeAgo(g.latest)}</span>
            </div>
            {g.target ? (
              <div className="mt-3">
                <p className="line-clamp-4 text-[0.9375rem] whitespace-pre-line wrap-anywhere">&ldquo;{g.target.text}&rdquo;</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {g.target.context}
                  {g.target.author && (
                    <>
                      {" · by "}
                      <Link href={`/u/${g.target.author}`} className="font-semibold text-foreground hover:underline">
                        @{g.target.author}
                      </Link>
                    </>
                  )}
                  {g.target.href && (
                    <>
                      {" · "}
                      <Link href={g.target.href} className="font-semibold text-foreground underline-offset-4 hover:underline">
                        Open
                      </Link>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Already removed.</p>
            )}
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {[...reasons].map(([reason, list]) => (
                <li key={reason} className="rounded-full border border-hairline px-2.5 py-1 text-xs font-semibold">
                  {label(reason)} {list.length > 1 && <span className="text-faint">×{list.length}</span>}
                </li>
              ))}
            </ul>
            {g.reports.some((r) => r.note) && (
              <ul className="mt-3 flex flex-col gap-1.5 border-l-2 border-hairline pl-3 text-sm text-muted-foreground">
                {g.reports
                  .filter((r) => r.note)
                  .map((r) => (
                    <li key={r.id} className="wrap-anywhere">
                      {r.note} <span className="text-faint">· @{r.by ?? "deleted"}</span>
                    </li>
                  ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap items-start gap-2">
              {g.target && (
                <ActionButton
                  run={removeContent}
                  args={[g.target_type, g.target_id, label(g.reports[0].reason)]}
                  label="Remove"
                  icon="remove"
                  done={`${WHAT[g.target_type]} removed`}
                  confirm={`Remove this ${WHAT[g.target_type].toLowerCase()}?`}
                  tone="danger"
                />
              )}
              <ActionButton run={dismissReports} args={[g.target_type, g.target_id]} label="Dismiss" icon="dismiss" done="Reports dismissed" />
              {g.target?.author_id && g.target.author && <BanControls account={g.target.author_id} handle={g.target.author} banned={false} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Restaurants({ restaurants }: { restaurants: Awaited<ReturnType<typeof getRestaurants>> }) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="add-place" className={CARD}>
        <h2 id="add-place" className="font-semibold">
          Add a restaurant
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">It goes live straight away. People can then add its dishes.</p>
        <AddRestaurantForm />
      </section>
      <section aria-labelledby="places">
        <h2 id="places" className={OVERLINE}>
          {restaurants.length} restaurants
        </h2>
        <ul className="mt-2 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <li key={r.id} className="border-b border-hairline">
              <Link href={`/r/${r.slug}`} className="-mx-2 flex min-h-14 items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{r.name}</span>
                  <span className="block text-xs text-faint">{r.area}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{r.dishes.length} dishes</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function People({ q, people }: { q: string; people: Awaited<ReturnType<typeof findPeople>> }) {
  return (
    <div className="flex flex-col gap-4">
      <form action="/admin" className="relative max-w-md">
        <input type="hidden" name="tab" value="people" />
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" name="q" defaultValue={q} placeholder="Search by handle" aria-label="Search people by handle" className="h-11 bg-raised pl-10" />
      </form>
      <p className={OVERLINE}>{q ? `Matching "${q}"` : "Newest accounts"}</p>
      {people.length ? (
        <ul className="stagger grid gap-3 lg:grid-cols-2">
          {people.map((p) => (
            <li key={p.id} className={cn(CARD, p.banned_at && "border-destructive/40")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/u/${p.username}`} className="font-semibold hover:underline">
                    @{p.username}
                  </Link>
                  {p.display_name && <span className="ml-1.5 text-sm text-muted-foreground">{p.display_name}</span>}
                  <p className="mt-0.5 text-xs text-faint">
                    Joined {timeAgo(p.created_at)} · {p.ratings} ratings · {p.comments} comments
                  </p>
                </div>
                {p.banned_at && <span className="shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">Banned</span>}
              </div>
              <div className="mt-3">
                <BanControls account={p.id} handle={p.username} banned={Boolean(p.banned_at)} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty icon={UsersRoundIcon}>No one matches that handle.</Empty>
      )}
    </div>
  );
}

function Log({ entries }: { entries: LogEntry[] }) {
  return entries.length ? <LogList entries={entries} /> : <Empty icon={ClipboardListIcon}>Nothing yet. Admin actions are recorded here.</Empty>;
}

const VERBS: Record<string, string> = { approve: "approved", delete: "removed", dismiss: "dismissed reports on", ban: "banned", unban: "unbanned", add: "added" };
const NOUNS: Record<string, string> = { dish: "a dish", rating: "a take", comment: "a comment", account: "an account", restaurant: "a restaurant" };

function LogList({ entries }: { entries: LogEntry[] }) {
  if (!entries.length) return <p className="mt-2 text-sm text-muted-foreground">Nothing yet.</p>;
  return (
    <ul className="mt-2 divide-y divide-hairline">
      {entries.map((e) => {
        const note = e.detail && typeof e.detail.reason === "string" ? e.detail.reason : e.detail && typeof e.detail.note === "string" ? e.detail.note : null;
        const name = e.detail && typeof e.detail.name === "string" ? e.detail.name : null;
        return (
          <li key={e.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
            <span className="min-w-0 wrap-anywhere">
              <span className="font-semibold">@{e.admin ?? "former admin"}</span> {VERBS[e.action] ?? e.action} {name ?? NOUNS[e.target_type] ?? e.target_type}
              {note && <span className="text-muted-foreground"> · {note}</span>}
            </span>
            <time dateTime={e.created_at} className="shrink-0 text-xs text-faint">
              {timeAgo(e.created_at)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}

function Empty({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-raised">
        <Icon aria-hidden className="size-5 text-mustard" />
      </span>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
