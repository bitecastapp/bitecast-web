"use client";

import { startTransition, useDeferredValue, useState, ViewTransition } from "react";
import Link from "next/link";
import { ChevronDownIcon, CrownIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import type { Profile } from "@/lib/auth";
import type { Restaurant } from "@/lib/restaurants";
import type { DishDiet, ShowDiet } from "@/lib/diet";
import { groupMeals, type FeedSort, type Review, type Vote } from "@/lib/ratings";
import { listHref, type Leader } from "@/lib/rankings";
import { ReviewCard } from "@/components/review-card";
import { MealCard } from "@/components/meal-card";
import { DietMark } from "@/components/diet-mark";
import { AccountMenu } from "@/components/account-menu";
import { DishAvg } from "@/components/dish-avg";
import { dishHref, dishKey } from "@/lib/dishes";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/page-shell";
import { Row, dishCount } from "@/components/row";

type View = "takes" | "rankings" | "dishes" | "places";
type Feed = { sort: FeedSort; reviews: Review[]; votes: Record<string, Vote> };
type DishGroup = { key: string; name: string; spots: { id: string; name: string; diet: DishDiet; avg: number | null; count: number; place: Restaurant }[] };

type HomeProps = { profile: Profile | null; restaurants: Restaurant[]; feed: Feed; leaders?: Leader[]; showDiet?: ShowDiet; notice?: string };

export function HomeView({ profile, restaurants, feed, leaders = [], showDiet = "all", notice }: HomeProps) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("takes");
  const q = dishKey(useDeferredValue(query));

  return (
    <PageShell
      wide
      action={
        <div className="flex items-center gap-2">
          <Link
            href={profile ? "/rate" : "/login"}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-ketchup px-3.5 text-sm font-semibold text-studio hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            <PlusIcon aria-hidden className="size-4" strokeWidth={2.5} />
            Rate
          </Link>
          {profile ? (
            <AccountMenu handle={profile.username} name={null} avatar={profile.avatar} photo={profile.avatar_path} />
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center rounded-md border border-hairline px-3.5 text-sm font-semibold transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Sign in
            </Link>
          )}
        </div>
      }
    >
      <h1 className="sr-only">Bitecast</h1>
      {showDiet !== "all" && (
        <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex gap-0.5">
            {showDiet === "vegan" ? (
              <DietMark diet="vegan" className="size-3" />
            ) : (
              <>
                <DietMark diet="veg" className="size-3" />
                {showDiet === "egg" && <DietMark diet="egg" className="size-3" />}
              </>
            )}
          </span>
          Showing {showDiet === "vegan" ? "vegan dishes only" : showDiet === "veg" ? "vegetarian dishes only" : "vegetarian and egg dishes"}
          <Link href="/settings#preferences" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Change
          </Link>
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-lg border border-hairline bg-paper px-4 py-3 text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      {/* Desktop: the feed on the left, a pinned side column on the right. Phones get the feed alone. */}
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-12 xl:gap-16">
        <div className="flex min-h-full flex-1 flex-col">
          <div className="relative">
            <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Dosa, biryani, a place…"
              aria-label="Search dishes and places"
              autoComplete="off"
              enterKeyHint="search"
              className="h-11 bg-raised pr-12 pl-11 text-base [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <XIcon className="size-5" />
              </button>
            )}
          </div>

          {!q && (
            <div role="group" aria-label="Show" className="mt-4 flex gap-6 border-b border-hairline">
              {(["takes", "rankings", "dishes", "places"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => startTransition(() => setView(v))}
                  className={cn(
                    "relative -mb-px min-h-11 text-sm font-semibold capitalize transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    view === v ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v}
                  {view === v && (
                    <ViewTransition name="home-tab-line" share="tab-line">
                      <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-mustard" />
                    </ViewTransition>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex-1">
            {q ? (
              <Results q={q} restaurants={restaurants} />
            ) : view === "takes" ? (
              <Takes feed={feed} viewer={profile?.username ?? null} />
            ) : view === "rankings" ? (
              <Rankings leaders={leaders} />
            ) : view === "dishes" ? (
              <Dishes groups={groupDishes(restaurants)} />
            ) : (
              <ByArea restaurants={restaurants} />
            )}
          </div>
        </div>

        <aside aria-label="Around Bitecast" className="hidden [scrollbar-width:none] lg:sticky [&::-webkit-scrollbar]:hidden lg:top-6 lg:flex lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:gap-9 lg:overflow-x-hidden lg:overflow-y-auto lg:px-2 lg:pb-6">
          <MostDiscussed reviews={feed.reviews} />
          <ByArea restaurants={restaurants} compact />
        </aside>
      </div>
    </PageShell>
  );
}

// One row per food list: "Top Dosa", with its current #1 (crowned) and how many dishes compete.
function Rankings({ leaders }: { leaders: Leader[] }) {
  if (!leaders.length) return <p className="text-muted-foreground">No rankings yet. They fill in as people rate.</p>;
  return (
    <ul className="stagger divide-y divide-border">
      {leaders.map(({ list, count, leader }) => (
        <li key={list.id}>
          <Row
            href={listHref(list.name)}
            title={`Top ${list.name}`}
            meta={
              leader ? (
                <>
                  <CrownIcon aria-label="Number one:" className="mr-1 inline size-3.5 align-[-2px] text-mustard" />
                  {leader.name}, {leader.restaurant.name} · {dishCount(count)}
                </>
              ) : (
                `${dishCount(count)} · none rated yet`
              )
            }
          />
        </li>
      ))}
    </ul>
  );
}

// The same dish at several places shows once; most-served dishes first.
function groupDishes(restaurants: Restaurant[], q = "") {
  const groups = new Map<string, DishGroup>();
  for (const place of restaurants) {
    for (const d of place.dishes) {
      const key = dishKey(d.name);
      if (q && !key.includes(q)) continue;
      const g = groups.get(key) ?? { key, name: d.name, spots: [] };
      g.spots.push({ id: d.id, name: d.name, diet: d.diet, avg: d.avg_score, count: d.rating_count, place });
      groups.set(key, g);
    }
  }
  return [...groups.values()].sort((a, b) => b.spots.length - a.spots.length || a.name.localeCompare(b.name));
}

function Dishes({ groups }: { groups: DishGroup[] }) {
  if (!groups.length) return <p className="text-muted-foreground">No dishes yet. Open a place and add the one you came for.</p>;
  return (
    <ul className="stagger divide-y divide-border">
      {groups.map((g) => (
        <li key={g.key}>
          <DishGroupRow group={g} />
        </li>
      ))}
    </ul>
  );
}

function DishGroupRow({ group: g }: { group: DishGroup }) {
  const title = <span className="block text-base font-semibold wrap-anywhere">{g.name}</span>;

  if (g.spots.length === 1) {
    const { name, diet, avg, count, place } = g.spots[0];
    return <Row href={dishHref(place.slug, name)} title={title} meta={<>{place.name} · <DishAvg avg={avg} count={count} orEmpty /></>} diet={diet} />;
  }
  return (
    <details className="group">
      <summary className="-mx-2 flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          {title}
          <span className="mt-0.5 block text-sm text-muted-foreground">At {g.spots.length} places</span>
        </span>
        <ChevronDownIcon aria-hidden className="size-5 shrink-0 text-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <ul className="mb-2 ml-3 animate-[rise_320ms_var(--ease-out-expo)_both] divide-y divide-border border-l-2 border-mustard pl-3">
        {g.spots.map(({ id, name, diet, avg, count, place }) => (
          <li key={id}>
            <Row href={dishHref(place.slug, name)} title={place.name} meta={<>{place.area} · <DishAvg avg={avg} count={count} orEmpty /></>} diet={diet} />
          </li>
        ))}
      </ul>
    </details>
  );
}

// compact: the desktop side column, where the list is a quick index rather than the page.
function ByArea({ restaurants, compact }: { restaurants: Restaurant[]; compact?: boolean }) {
  if (restaurants.length === 0) return compact ? null : <p className="text-muted-foreground">No places yet. Check back soon.</p>;
  const areas = Map.groupBy(restaurants, (r) => r.area);
  const Heading = compact ? "h3" : "h2"; // aria-label, not aria-labelledby: area names have spaces, which break id lists
  return (
    <div className={cn("flex flex-col", compact ? "gap-5" : "gap-7")}>
      {compact && <h2 className={OVERLINE}>Places</h2>}
      {[...areas].map(([area, list]) => (
        <section key={area} aria-label={area}>
          <Heading className={cn(OVERLINE, compact && "text-[0.6875rem]")}>
            {area}
          </Heading>
          <ul className="divide-y divide-border">
            {list.map((r) => (
              <li key={r.id}>
                {compact ? (
                  <Link href={`/r/${r.slug}`} className={SIDE_LINK}>
                    <span className="min-w-0 py-2 wrap-anywhere">{r.name}</span>
                    <span className="shrink-0 text-xs text-faint tabular-nums">{dishCount(r.dishes.length)}</span>
                  </Link>
                ) : (
                  <Row href={`/r/${r.slug}`} title={r.name} meta={dishCount(r.dishes.length)} />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const OVERLINE = "text-xs font-semibold tracking-[0.08em] text-faint uppercase";
const SIDE_LINK =
  "-mx-2 flex min-h-10 items-center justify-between gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

// Dishes with the most takes and comments in the loaded feed.
// shortcut: counts only the feed page already fetched, move to a DB view once the feed paginates.
function MostDiscussed({ reviews }: { reviews: Review[] }) {
  const dishes = [
    ...Map.groupBy(reviews, (r) => dishHref(r.dish.restaurant.slug, r.dish.name)).entries(),
  ]
    .map(([href, list]) => ({ href, dish: list[0].dish, talk: list.length + list.reduce((n, r) => n + r.comments_count, 0) }))
    .sort((a, b) => b.talk - a.talk)
    .slice(0, 5);
  if (!dishes.length) return null;
  return (
    <section aria-labelledby="most-discussed">
      <h2 id="most-discussed" className={OVERLINE}>
        Most discussed
      </h2>
      <ol className="mt-2">
        {dishes.map(({ href, dish }, i) => (
          <li key={href}>
            <Link href={href} className={cn(SIDE_LINK, "min-h-14 justify-start py-2")}>
              <span aria-hidden className="w-4 shrink-0 text-sm font-semibold text-mustard tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-foreground wrap-anywhere">
                  <DietMark diet={dish.diet} className="mr-1.5 size-3 align-[-1px]" />
                  {dish.name}
                </span>
                <span className="block text-xs text-faint wrap-anywhere">
                  {dish.restaurant.name}
                  {dish.rating_count > 0 && <DishAvg avg={dish.avg_score} count={dish.rating_count} className="ml-1.5" />}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Results({ q, restaurants }: { q: string; restaurants: Restaurant[] }) {
  const groups = groupDishes(restaurants, q);
  const places = restaurants.filter((r) => dishKey(`${r.name} ${r.area}`).includes(q));

  if (!places.length && !groups.length) {
    return (
      <p role="status" className="text-muted-foreground">
        Nothing matches that yet. Try a dish like &ldquo;idli&rdquo; or a place name.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-7">
      <p role="status" className="sr-only">
        {[groups.length && dishCount(groups.length), places.length && placeCount(places.length)].filter(Boolean).join(" and ")} found
      </p>
      {groups.length > 0 && (
        <section aria-labelledby="dish-results">
          <h2 id="dish-results" className="text-sm font-bold text-foreground">
            {dishCount(groups.length)}
          </h2>
          <Dishes groups={groups} />
        </section>
      )}
      {places.length > 0 && (
        <section aria-labelledby="place-results">
          <h2 id="place-results" className="text-sm font-bold text-foreground">
            {placeCount(places.length)}
          </h2>
          <ul className="divide-y divide-border">
            {places.map((r) => (
              <li key={r.id}>
                <Row href={`/r/${r.slug}`} title={r.name} meta={r.area} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const placeCount = (n: number) => (n === 1 ? "1 place" : `${n} places`);

function Takes({ feed, viewer }: { feed: Feed; viewer: string | null }) {
  return (
    <section aria-label="Takes">
      <nav aria-label="Sort takes" className="mb-1 flex gap-4 text-sm">
        {(viewer ? (["top", "new", "following"] as const) : (["top", "new"] as const)).map((s) => (
          <Link
            key={s}
            href={`/?sort=${s}`}
            replace
            aria-current={feed.sort === s ? "page" : undefined}
            scroll={false}
            className={cn(
              "inline-flex min-h-10 items-center capitalize focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              feed.sort === s ? "font-semibold text-mustard" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
            {s === "new" && (
              <span aria-hidden className="ml-1.5 size-1.5 animate-[on-air_1.6s_ease-in-out_infinite] rounded-full bg-ketchup" />
            )}
          </Link>
        ))}
      </nav>
      {feed.reviews.length ? (
        <ul className="stagger divide-y divide-hairline">
          {groupMeals(feed.reviews).map((meal) => (
            <li key={meal[0].id}>
              {meal.length > 1 ? (
                <MealCard reviews={meal} votes={feed.votes} viewer={viewer} />
              ) : (
                <ReviewCard review={meal[0]} vote={feed.votes[meal[0].id]} viewer={viewer} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-10 text-center">
          <p className="font-semibold">{feed.sort === "following" ? "Nothing from your people yet" : "No takes yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {feed.sort === "following"
              ? "Follow people from their profiles and their takes land here."
              : "Rate a dish and write what you thought. It shows up here."}
          </p>
        </div>
      )}
    </section>
  );
}
