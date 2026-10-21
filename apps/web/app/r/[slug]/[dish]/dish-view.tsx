import type { DishDetail } from "@/lib/restaurants";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/page-shell";
import { BackLink } from "@/app/r/[slug]/restaurant-view";

export function DishView({ dish }: { dish: DishDetail }) {
  return (
    <PageShell>
      <BackLink href={`/r/${dish.restaurant.slug}`}>{dish.restaurant.name}</BackLink>
      <h1
        className={cn(
          "mt-2 leading-[1.05] font-extrabold tracking-[-0.03em] wrap-anywhere",
          dish.name.length > 24 ? "text-[2rem]" : "text-[2.75rem]",
        )}
      >
        {dish.name}
      </h1>
      <p className="mt-2 text-muted-foreground">
        at {dish.restaurant.name}, {dish.restaurant.area}
      </p>
      <div className="mt-10 rounded-xl border border-border bg-glass px-5 py-6">
        <p className="font-bold">Ratings open soon</p>
        <p className="mt-1 text-muted-foreground">You&apos;ll be able to score this dish 1–10 and leave a hot take.</p>
      </div>
    </PageShell>
  );
}
