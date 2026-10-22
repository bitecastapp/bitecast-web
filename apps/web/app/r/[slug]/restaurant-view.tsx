import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import { PageShell } from "@/components/page-shell";
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
    <PageShell>
      <BackLink href="/">All places</BackLink>
      <h1 className="mt-2 text-2xl leading-tight font-bold tracking-tight wrap-anywhere">{r.name}</h1>
      <p className="mt-1 text-muted-foreground">
        {r.area}, {r.city}
      </p>

      <section aria-labelledby="menu" className="mt-8">
        <h2 id="menu" className="text-sm font-bold text-foreground">
          {dishCount(r.dishes.length)}
        </h2>
        {r.dishes.length ? (
          <ul className="divide-y divide-border">
            {r.dishes.map((d) => (
              <li key={d.id}>
                <Row href={dishHref(r.slug, d.name)} title={d.name} meta={scoreLine(d.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted-foreground">No dishes yet. Add the one you came for.</p>
        )}
      </section>

      <div className="mt-6">
        {signedIn ? (
          <AddDish restaurantId={r.id} restaurantSlug={r.slug} restaurantName={r.name} dishes={r.dishes} />
        ) : (
          <SignInPrompt>to add a dish</SignInPrompt>
        )}
      </div>
    </PageShell>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-ml-1 inline-flex min-h-11 w-fit max-w-full items-center gap-1 rounded-md pr-2 text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ChevronLeftIcon aria-hidden className="size-4 shrink-0" />
      <span className="wrap-anywhere">{children}</span>
    </Link>
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
