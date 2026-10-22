import Link from "next/link";
import type { Restaurant } from "@/lib/restaurants";
import { PageShell } from "@/components/page-shell";
import { BackLink } from "@/components/back-link";
import { Row, dishCount } from "@/components/row";
import { AddDish } from "./add-dish";
import { dishHref } from "@/lib/dishes";
import { summarize } from "@/lib/ratings";

type ViewProps = { restaurant: Restaurant; signedIn?: boolean; scores?: { dish_id: string; score: number }[] };

export function RestaurantView({ restaurant: r, signedIn = true, scores = [] }: ViewProps) {
  const scoreLine = (dishId: string) => {
    const { count, average } = summarize(scores.filter((s) => s.dish_id === dishId).map((s) => s.score));
    return average === null ? "No ratings yet" : `${average.toFixed(1)} from ${count} ${count === 1 ? "rating" : "ratings"}`;
  };
  return (
    <PageShell wide>
      {/* Desktop: the place and "Add a dish" on the left, its dishes on the right. Source order stays phone order. */}
      <div className="lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-14 xl:gap-x-20">
        <div className="flex flex-col lg:col-start-1">
          <BackLink href="/" />
          <h1 className="mt-2 text-2xl leading-tight font-bold tracking-tight wrap-anywhere">{r.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {r.area}, {r.city}
          </p>
        </div>

        <section aria-labelledby="menu" className="mt-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:pt-14">
          <h2 id="menu" className="text-sm font-bold text-foreground">
            {dishCount(r.dishes.length)}
          </h2>
          {r.dishes.length ? (
            <ul className="divide-y divide-border">
              {r.dishes.map((d) => (
                <li key={d.id}>
                  <Row href={dishHref(r.slug, d.name)} title={d.name} meta={scoreLine(d.id)} veg={d.veg} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted-foreground">No dishes yet. Add the one you came for.</p>
          )}
        </section>

        <div className="mt-6 lg:col-start-1 lg:row-start-2 lg:mt-8">
          {signedIn ? (
            <AddDish restaurantId={r.id} restaurantSlug={r.slug} restaurantName={r.name} dishes={r.dishes} />
          ) : (
            <SignInPrompt>to add a dish</SignInPrompt>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// What signed-out visitors see where a write action would be.
export function SignInPrompt({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground">
      <Link href="/login" className="font-bold text-foreground underline underline-offset-4">
        Sign in
      </Link>{" "}
      {children}
    </p>
  );
}
