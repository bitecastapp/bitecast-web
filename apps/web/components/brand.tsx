import Link from "next/link";
import { cn } from "@/lib/utils";

// "bitecast." in the brand face until the owner's logo files arrive.
export function Wordmark({ className, href = "/" }: { className?: string; href?: string | null }) {
  const mark = (
    <span className={cn("font-brand text-[1.375rem] leading-none font-black tracking-[-0.04em]", className)}>
      bitecast<span className="text-ketchup">.</span>
    </span>
  );
  return href ? (
    <Link href={href} aria-label="bitecast home" className="-mx-1 rounded-sm px-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {mark}
    </Link>
  ) : (
    mark
  );
}

// The app icon's "b" with three broadcast waves. `lit` waves (0–3) glow Ketchup.
export function BroadcastMark({ lit, className }: { lit: number; className?: string }) {
  const waves = ["M118 66a22 22 0 0 1 22 22", "M118 44a44 44 0 0 1 44 44", "M118 22a66 66 0 0 1 66 66"];
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={cn("h-auto w-full", className)}>
      <path
        d="M40 36h28v44c8-8 18-12 30-12 30 0 50 22 50 52s-20 52-50 52c-13 0-24-5-32-14v12H40Zm56 62c-15 0-26 10-26 24s11 24 26 24 26-10 26-24-11-24-26-24Z"
        className="fill-spotlight"
      />
      {waves.map((d, i) => (
        <path
          key={`${i}-${i < lit}`}
          d={d}
          fill="none"
          strokeWidth={14}
          strokeLinecap="round"
          className={i < lit ? "animate-[wave-on_420ms_ease-out_both] stroke-ketchup" : "stroke-spotlight/15"}
          style={{ animationDelay: `${i * 110}ms` }}
        />
      ))}
    </svg>
  );
}
