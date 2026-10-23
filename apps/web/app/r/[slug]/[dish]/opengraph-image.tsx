import { ogCard, OG_SIZE } from "@/lib/og-card";
import { shareDish } from "@/lib/share";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A dish on Bitecast";

export default async function Image({ params }: { params: Promise<{ slug: string; dish: string }> }) {
  const { slug, dish } = await params;
  const d = await shareDish(slug, dish);
  if (!d) return ogCard({ eyebrow: "Bitecast", title: "Rate the dish, not the place." });
  return ogCard({
    eyebrow: "Dish",
    title: d.name,
    subtitle: `${d.place}, ${d.area}`,
    body: d.count ? undefined : "No ratings yet. Be the first.",
    score: d.avg,
    scoreNote: d.count ? `${d.count} ${d.count === 1 ? "RATING" : "RATINGS"}` : undefined,
    photo: d.photo,
  });
}
