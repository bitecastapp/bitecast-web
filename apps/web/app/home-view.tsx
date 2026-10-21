"use client";

import { useDeferredValue, useState } from "react";
import { ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";
import type { Profile } from "@/lib/auth";
import type { Restaurant } from "@/lib/restaurants";
import { dishHref, dishKey } from "@/lib/dishes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/page-shell";
import { Row, dishCount } from "@/components/row";
import { signOut } from "./actions";

type View = "dishes" | "places";
type DishGroup = { key: string; name: string; spots: { id: string; name: string; place: Restaurant }[] };

export function HomeView({ profile, restaurants }: { profile: Profile; restaurants: Restaurant[] }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("dishes");
  const q = dishKey(useDeferredValue(query));

  return (
    <PageShell>
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">What are you craving?</h1>
      <div className="relative mt-5">
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Dosa, biryani, a place…"
          aria-label="Search dishes and places"
          autoComplete="off"
          enterKeyHint="search"
          className="h-13 bg-glass pr-12 pl-11 text-base [&::-webkit-search-cancel-button]:hidden"
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
        <div role="group" aria-label="Show" className="mt-4 grid w-full grid-cols-2 rounded-xl bg-muted p-1">
          {(["dishes", "places"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "min-h-11 rounded-lg text-sm font-bold capitalize transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                view === v ? "bg-glass text-foreground shadow-[0_0_0_1px_var(--border)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex-1">
        {q ? (
          <Results q={q} restaurants={restaurants} />
        ) : view === "dishes" ? (
          <Dishes groups={groupDishes(restaurants)} />
        ) : (
          <ByArea restaurants={restaurants} />
        )}
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
        <span className="min-w-0 wrap-anywhere">
          Signed in as <span className="font-semibold text-foreground">@{profile.username}</span>
        </span>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="lg" className="-mr-2.5 min-h-11">
            Sign out
          </Button>
        </form>
      </footer>
    </PageShell>
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
      g.spots.push({ id: d.id, name: d.name, place });
      groups.set(key, g);
    }
  }
  return [...groups.values()].sort((a, b) => b.spots.length - a.spots.length || a.name.localeCompare(b.name));
}

function Dishes({ groups }: { groups: DishGroup[] }) {
  if (!groups.length) return <p className="text-muted-foreground">No dishes yet. Open a place and add the one you came for.</p>;
  return (
    <ul className="divide-y divide-border">
      {groups.map((g) => (
        <li key={g.key}>
          <DishGroupRow group={g} />
        </li>
      ))}
    </ul>
  );
}

function DishGroupRow({ group: g }: { group: DishGroup }) {
  const title = <span className="block text-2xl leading-tight font-extrabold tracking-tight wrap-anywhere">{g.name}</span>;

  if (g.spots.length === 1) {
    const { name, place } = g.spots[0];
    return <Row href={dishHref(place.slug, name)} title={title} meta={`${place.name} · ${place.area}`} />;
  }
  return (
    <details className="group">
      <summary className="-mx-2 flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          {title}
          <span className="mt-0.5 block text-sm text-muted-foreground">At {g.spots.length} places</span>
        </span>
        <ChevronDownIcon aria-hidden className="size-5 shrink-0 text-lattice transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <ul className="mb-2 ml-3 animate-[rise_320ms_var(--ease-out-expo)_both] divide-y divide-border border-l-2 border-pane-live pl-3">
        {g.spots.map(({ id, name, place }) => (
          <li key={id}>
            <Row href={dishHref(place.slug, name)} title={place.name} meta={place.area} />
          </li>
        ))}
      </ul>
    </details>
  );
}

function ByArea({ restaurants }: { restaurants: Restaurant[] }) {
  if (restaurants.length === 0) return <p className="text-muted-foreground">No places yet. Check back soon.</p>;
  const areas = Map.groupBy(restaurants, (r) => r.area);
  return (
    <div className="flex flex-col gap-7">
      {[...areas].map(([area, list]) => (
        <section key={area} aria-labelledby={`area-${area}`}>
          <h2 id={`area-${area}`} className="flex items-center gap-3 text-sm font-bold text-lattice after:h-px after:flex-1 after:bg-border">
            {area}
          </h2>
          <ul className="divide-y divide-border">
            {list.map((r) => (
              <li key={r.id}>
                <Row href={`/r/${r.slug}`} title={r.name} meta={dishCount(r.dishes.length)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
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
          <h2 id="dish-results" className="text-sm font-bold text-lattice">
            {dishCount(groups.length)}
          </h2>
          <Dishes groups={groups} />
        </section>
      )}
      {places.length > 0 && (
        <section aria-labelledby="place-results">
          <h2 id="place-results" className="text-sm font-bold text-lattice">
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
