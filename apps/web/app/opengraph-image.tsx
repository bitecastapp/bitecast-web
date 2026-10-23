import { ogCard, OG_SIZE } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Bitecast: rate the dish, not the place";

export default function Image() {
  return ogCard({
    eyebrow: "Bitecast",
    title: "Find the dish worth eating.",
    subtitle: "Rate dishes, not restaurants. Argue about the takes.",
    body: "Rankings for every food, and how people from its home rate it.",
  });
}
