import { ogCard, OG_SIZE } from "@/lib/og-card";
import { shareTake } from "@/lib/share";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A take on Bitecast";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await shareTake(id);
  if (!t) return ogCard({ eyebrow: "Bitecast", title: "Rate the dish, not the place." });
  return ogCard({ eyebrow: `Take by @${t.author}`, title: t.dish, subtitle: t.place, body: `“${t.take}”`, score: t.score, photo: t.photo });
}
