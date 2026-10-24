import Link from "next/link";
import { cn } from "@/lib/utils";
import { badgeUri } from "@/lib/logo";

const MASK = `url("${badgeUri("#000")}")`;

// The mark: the Must try badge in mustard, upright, with a Suez One "n".
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-grid shrink-0 place-items-center text-studio", className)} style={{ width: size, height: size }}>
      <span className="absolute inset-0 bg-mustard" style={{ maskImage: MASK, WebkitMaskImage: MASK, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }} />
      {/* The dashed ring: thinner on small marks so the dashes stay crisp, and left off the tiniest (the verdict chip). */}
      {size >= 24 && <span className={cn("absolute inset-[19%] rounded-full border-dashed border-studio/40", size >= 40 ? "border-[1.5px]" : "border")} />}
      {/* Suez One sits low in its line box; lift it to the badge's centre. Smaller on tiny marks (the verdict chip),
          where a full-size n reads as a capital. */}
      <span className="relative font-mark leading-none font-normal normal-case" style={{ fontSize: size * (size >= 24 ? 0.56 : 0.46), transform: `translateY(${-size * 0.04}px)` }}>
        n
      </span>
    </span>
  );
}

// The lockup: the mark and "nomrank." in Plus Jakarta Sans ExtraBold.
export function Wordmark({ className, href = "/" }: { className?: string; href?: string | null }) {
  const mark = (
    <span className={cn("inline-flex items-center gap-2 text-[1.375rem] leading-none", className)}>
      {/* Centred on the lowercase letters, not the line box (which leaves room for capitals "nomrank" doesn't have). */}
      <LogoMark size={28} className="translate-y-[0.135em]" />
      <span className="font-wordmark font-extrabold tracking-[-0.035em]">
        nomrank<span className="text-ketchup">.</span>
      </span>
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
