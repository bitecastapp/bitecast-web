import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { DietMark } from "@/components/diet-mark";

// A tappable list row: title (plain text, or a pre-styled element), one line of detail, chevron.
// Dish rows pass `veg` to show the veg/non-veg mark before the title.
export function Row({ href, title, meta, veg }: { href: string; title: React.ReactNode; meta: string; veg?: boolean }) {
  return (
    <Link
      href={href}
      className="-mx-2 flex min-h-16 items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {veg !== undefined && <DietMark veg={veg} className="mt-1 self-start" />}
      <span className="min-w-0 flex-1">
        {typeof title === "string" ? <span className="block text-base font-bold wrap-anywhere">{title}</span> : title}
        <span className="mt-0.5 block text-sm wrap-anywhere text-muted-foreground">{meta}</span>
      </span>
      <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-foreground" />
    </Link>
  );
}

export function dishCount(n: number) {
  return n === 1 ? "1 dish" : `${n} dishes`;
}
