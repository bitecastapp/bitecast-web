import Link from "next/link";
import { PlusIcon } from "lucide-react";
import type { Dish, Restaurant } from "@/lib/restaurants";
import { DietMark } from "@/components/diet-mark";
import { DishAvg } from "@/components/dish-avg";

const MAX_CHIPS = 8;

// After you rate a dish: the rest of that place's menu as one-tap chips, so logging a whole meal takes seconds.
export function RateAnother({ restaurant, dishes }: { restaurant: Restaurant; dishes: Dish[] }) {
  return (
    <section aria-labelledby="rate-another" className="rounded-xl border border-hairline bg-paper p-4">
      <h2 id="rate-another" className="text-[0.9375rem] font-semibold wrap-anywhere">
        Had something else at {restaurant.name}?
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {dishes.length ? "Rate it while it's fresh." : "You've rated everything on the list here."}
      </p>
      {dishes.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {dishes.slice(0, MAX_CHIPS).map((d) => (
            <li key={d.id} className="max-w-full">
              <Link
                href={`/rate?dish=${d.id}`}
                className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border border-hairline bg-raised px-3 text-sm font-medium transition-colors hover:border-mustard focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <PlusIcon aria-hidden className="size-3.5 shrink-0 text-mustard" strokeWidth={2.5} />
                <DietMark diet={d.diet} className="size-3" />
                <span className="truncate">{d.name}</span>
                <DishAvg avg={d.avg_score} count={d.rating_count} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={`/r/${restaurant.slug}`}
        className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {dishes.length > MAX_CHIPS ? `See all ${dishes.length} dishes` : "Not listed? Add a dish"}
      </Link>
    </section>
  );
}
