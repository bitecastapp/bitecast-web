import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { keyFromDishSlug } from "@/lib/dishes";
import { getDish } from "@/lib/restaurants";
import { PageShell } from "@/components/page-shell";
import { DishView } from "./dish-view";

export default function DishPage({ params }: PageProps<"/r/[slug]/[dish]">) {
  return (
    <Suspense fallback={<PageShell>{null}</PageShell>}>
      <Dish params={params} />
    </Suspense>
  );
}

async function Dish({ params }: Pick<PageProps<"/r/[slug]/[dish]">, "params">) {
  const { slug, dish: dishSlug } = await params;
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const dish = await getDish(supabase, slug, keyFromDishSlug(decodeURIComponent(dishSlug)));
  if (!dish) notFound();
  return <DishView dish={dish} />;
}
