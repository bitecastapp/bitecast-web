import Link from "next/link";
import { cn } from "@/lib/utils";

// "nomrank." in the brand face until the owner's logo files arrive.
export function Wordmark({ className, href = "/" }: { className?: string; href?: string | null }) {
  const mark = (
    <span className={cn("font-brand text-[1.375rem] leading-none font-black tracking-[-0.04em]", className)}>
      nomrank<span className="text-ketchup">.</span>
    </span>
  );
  return href ? (
    <Link href={href} aria-label="nomrank home" className="-mx-1 rounded-sm px-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {mark}
    </Link>
  ) : (
    mark
  );
}

// The app icon: an "n" with three waves off its shoulder. `lit` waves (0–3) glow Ketchup; `pulse` loops them
// outward one after another (the loader).
export function BroadcastMark({ lit, pulse, className }: { lit: number; pulse?: boolean; className?: string }) {
  const waves = ["M118 66a22 22 0 0 1 22 22", "M118 44a44 44 0 0 1 44 44", "M118 22a66 66 0 0 1 66 66"];
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={cn("h-auto w-full", className)}>
      <path
        d="M40 172V70h28v10c8-8 18-12 30-12 30 0 50 22 50 52v52h-28v-52c0-15-9-26-22-26s-30 11-30 26v52Z"
        className="fill-spotlight"
      />
      {waves.map((d, i) => (
        <path
          key={`${i}-${i < lit}`}
          d={d}
          fill="none"
          strokeWidth={14}
          strokeLinecap="round"
          className={
            pulse
              ? "animate-[wave-pulse_1.4s_var(--ease-in-out)_infinite] stroke-ketchup"
              : i < lit
                ? "animate-[wave-on_420ms_ease-out_both] stroke-ketchup"
                : "stroke-spotlight/15"
          }
          style={{ animationDelay: `${i * (pulse ? 180 : 110)}ms` }}
        />
      ))}
    </svg>
  );
}
