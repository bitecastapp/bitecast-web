import { cn } from "@/lib/utils";

// India's food mark: a square with a dot (veg) or a triangle (non-veg). Shape tells them apart as well as colour,
// so it still works for colour-blind eyes. Shades are lifted from the printed green/brown to hold 3:1 on the dark ground.
const VEG = "#34b864";
const NON_VEG = "#e06a2c";

export function DietMark({ veg, className }: { veg: boolean; className?: string }) {
  const color = veg ? VEG : NON_VEG;
  const label = veg ? "Veg" : "Non-veg";
  return (
    <svg role="img" aria-label={label} viewBox="0 0 16 16" className={cn("inline-block size-3.5 shrink-0", className)}>
      <title>{label}</title>
      <rect x="1" y="1" width="14" height="14" rx="2.5" fill="none" stroke={color} strokeWidth="1.6" />
      {veg ? <circle cx="8" cy="8" r="3.4" fill={color} /> : <path d="M8 4.4 11.8 11H4.2Z" fill={color} />}
    </svg>
  );
}
