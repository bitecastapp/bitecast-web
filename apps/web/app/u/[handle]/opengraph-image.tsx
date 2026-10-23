import { ogCard, OG_SIZE } from "@/lib/og-card";
import { shareProfile } from "@/lib/share";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A Bitecast profile";

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const p = await shareProfile(handle);
  if (!p) return ogCard({ eyebrow: "Bitecast", title: "Rate the dish, not the place." });
  return ogCard({
    eyebrow: "Profile",
    title: p.name ?? `@${p.handle}`,
    subtitle: `${p.name ? `@${p.handle} · ` : ""}${p.rated} ${p.rated === 1 ? "dish" : "dishes"} rated`,
    body: p.bio ?? undefined,
    score: p.rated ? p.average : null,
    scoreNote: p.rated ? "AVERAGE" : undefined,
  });
}
