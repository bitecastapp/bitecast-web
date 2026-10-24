import { ogCard, OG_SIZE } from "@/lib/og-card";
import { shareList } from "@/lib/share";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A Nomrank ranking";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await shareList(slug);
  if (!l) return ogCard({ eyebrow: "Nomrank", title: "Rate the dish, not the place." });
  return ogCard({
    eyebrow: "Rankings",
    title: `Top ${l.name}`,
    subtitle: `${l.count} ${l.count === 1 ? "dish" : "dishes"}, ranked by the people who ate them`,
    body: l.top.length ? l.top.map((d, i) => `${i + 1}. ${d.name}, ${d.place}`).join("\n") : "Nothing rated yet. Rate one and take the top spot.",
  });
}
