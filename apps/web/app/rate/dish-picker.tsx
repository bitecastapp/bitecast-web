"use client";

import { useDeferredValue, useState } from "react";
import { SearchIcon } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import { dishKey } from "@/lib/dishes";
import { Input } from "@/components/ui/input";
import { Row } from "@/components/row";

// Step one of rating: find the dish (across every place).
export function DishPicker({ restaurants }: { restaurants: Restaurant[] }) {
  const [query, setQuery] = useState("");
  const q = dishKey(useDeferredValue(query));
  const dishes = restaurants
    .flatMap((r) => r.dishes.map((d) => ({ ...d, place: r })))
    .filter((d) => !q || dishKey(`${d.name} ${d.place.name}`).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Dish or place"
          aria-label="Find the dish you ate"
          autoComplete="off"
          autoFocus
          className="h-11 bg-raised pl-11 text-base"
        />
      </div>
      <ul className="divide-y divide-border" aria-live="polite">
        {dishes.map((d) => (
          <li key={d.id}>
            <Row href={`/rate?dish=${d.id}`} title={d.name} meta={`${d.place.name} · ${d.place.area}`} />
          </li>
        ))}
      </ul>
      {!dishes.length && <p className="text-muted-foreground">Not here yet? Open the place and add the dish first.</p>}
    </div>
  );
}
