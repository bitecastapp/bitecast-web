import { cn } from "@/lib/utils";

// Four marks, each a square with its own shape inside, so they read apart without colour too:
// veg = dot (India's green mark), vegan = leaf, egg = oval, non-veg = triangle (India's brown mark).
// Shades are lifted from the printed ones to hold 3:1 on the dark ground.
export type DietKind = "veg" | "vegan" | "egg" | "non_veg";

const MARKS: Record<DietKind, { label: string; color: string; inner: React.ReactNode }> = {
  veg: { label: "Veg", color: "#34b864", inner: <circle cx="8" cy="8" r="3.4" /> },
  vegan: {
    label: "Vegan",
    color: "#34b864",
    inner: <path d="M4.6 11.4C4.4 7.3 7 4.6 11.4 4.6c.2 4.1-2.5 6.8-6.8 6.8Z" />,
  },
  egg: { label: "Egg", color: "#f0b232", inner: <ellipse cx="8" cy="8.4" rx="2.7" ry="3.5" /> },
  non_veg: { label: "Non-veg", color: "#e06a2c", inner: <path d="M8 4.4 11.8 11H4.2Z" /> },
};

export function DietMark({ diet, className }: { diet: DietKind; className?: string }) {
  const { label, color, inner } = MARKS[diet];
  return (
    <svg role="img" aria-label={label} viewBox="0 0 16 16" className={cn("inline-block size-3.5 shrink-0", className)}>
      <title>{label}</title>
      <rect x="1" y="1" width="14" height="14" rx="2.5" fill="none" stroke={color} strokeWidth="1.6" />
      <g fill={color} stroke={color} strokeWidth="0">
        {inner}
      </g>
    </svg>
  );
}
