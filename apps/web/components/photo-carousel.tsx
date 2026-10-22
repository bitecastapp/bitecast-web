"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { photoUrl } from "@/lib/ratings";
import { cn } from "@/lib/utils";

type Props = {
  photos: { path: string; position: number }[];
  dish: string; // for alt text
  href?: string; // in a feed, tapping a photo opens the take
  className?: string; // size and spacing come from the caller
};

// A take's photos: one shows plainly; several swipe sideways with a "2/3" count, dots for the active photo,
// and arrows on hover for mouse users.
export function PhotoCarousel({ photos, dish, href, className }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const sorted = photos.toSorted((a, b) => a.position - b.position);
  const many = sorted.length > 1;

  function go(i: number) {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div
      role={many ? "region" : undefined}
      aria-roledescription={many ? "carousel" : undefined}
      aria-label={many ? `Photos of ${dish}` : undefined}
      className={cn("group/carousel relative z-10 overflow-hidden rounded-lg bg-raised", className)}
    >
      <div
        ref={track}
        onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sorted.map((p, i) => {
          // eslint-disable-next-line @next/next/no-img-element -- user photos from Supabase Storage, resized on upload
          const img = <img src={photoUrl(p.path)} alt={`Photo ${i + 1} of ${dish}`} className="size-full object-cover" loading="lazy" draggable={false} />;
          return (
            <div key={p.path} aria-roledescription={many ? "slide" : undefined} aria-label={many ? `${i + 1} of ${sorted.length}` : undefined} className="size-full shrink-0 snap-center">
              {href ? (
                // The take itself is the card's real link; this one just makes the photo tappable too.
                <Link href={href} tabIndex={-1} className="block size-full">
                  {img}
                </Link>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>

      {many && (
        <>
          <span aria-hidden className="pointer-events-none absolute top-2 right-2 rounded-full bg-studio/70 px-2 py-0.5 text-xs font-semibold tabular-nums backdrop-blur-sm">
            {active + 1}/{sorted.length}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-linear-to-t from-studio/60 to-transparent pt-6 pb-1.5">
            {sorted.map((p, i) => (
              <button
                key={p.path}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active || undefined}
                onClick={() => go(i)}
                className="pointer-events-auto grid size-4 place-items-center rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "h-1.5 w-4 rounded-full bg-spotlight transition-[transform,opacity] duration-200 ease-[var(--ease-out)]",
                    i === active ? "scale-x-100 opacity-100" : "scale-x-[0.375] opacity-50",
                  )}
                />
              </button>
            ))}
          </div>
          {[
            { dir: -1, label: "Previous photo", Icon: ChevronLeftIcon, side: "left-2", hidden: active === 0 },
            { dir: 1, label: "Next photo", Icon: ChevronRightIcon, side: "right-2", hidden: active === sorted.length - 1 },
          ].map(({ dir, label, Icon, side, hidden }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={() => go(active + dir)}
              className={cn(
                "absolute top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-studio/70 text-spotlight opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover/carousel:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [@media(hover:hover)_and_(pointer:fine)]:grid",
                side,
                hidden && "invisible",
              )}
            >
              <Icon aria-hidden className="size-4" />
            </button>
          ))}
        </>
      )}
    </div>
  );
}
