import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDishById, getRestaurants } from "@/lib/restaurants";
import { PageShell } from "@/components/page-shell";
import { BackLink } from "@/components/back-link";
import { DietMark } from "@/components/diet-mark";
import { dishHref } from "@/lib/dishes";
import { DishPicker } from "./dish-picker";
import { RateForm } from "./rate-form";

export const metadata: Metadata = { title: "Rate · Bitecast" };

export default function RatePage({ searchParams }: PageProps<"/rate">) {
  return (
    <PageShell>
      <Suspense>
        <Rate searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

async function Rate({ searchParams }: Pick<PageProps<"/rate">, "searchParams">) {
  const dishId = (await searchParams).dish;
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  if (typeof dishId !== "string") {
    return (
      <>
        <BackLink href="/" />
        <h1 className="mt-2 mb-6 text-2xl leading-tight font-bold tracking-tight">What did you eat?</h1>
        <DishPicker restaurants={await getRestaurants(supabase)} />
      </>
    );
  }

  const dish = await getDishById(supabase, dishId);
  if (!dish) notFound();
  const { data: mine } = await supabase
    .from("ratings")
    .select("score, take, photos:rating_photos(path, position)")
    .eq("dish_id", dish.id)
    .eq("user_id", userId)
    .maybeSingle<{ score: number; take: string | null; photos: { path: string; position: number }[] }>();

  return (
    <>
      <BackLink href={dishHref(dish.restaurant.slug, dish.name)} />
      <h1 className="mt-2 text-2xl leading-snug font-bold tracking-tight wrap-anywhere">How was the {dish.name}?</h1>
      <p className="mt-1 mb-7 text-muted-foreground">
        <DietMark veg={dish.veg} className="mr-1.5 align-[-0.1em]" />
        at {dish.restaurant.name}, {dish.restaurant.area}
        {mine && " · you've rated this before, saving updates it"}
      </p>
      <RateForm
        dish={dish}
        userId={userId}
        existing={mine && { score: mine.score, take: mine.take, photos: mine.photos.sort((a, b) => a.position - b.position).map((p) => p.path) }}
      />
    </>
  );
}
