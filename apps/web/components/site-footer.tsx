import Link from "next/link";
import { BookOpenIcon, HeartHandshakeIcon, ScaleIcon, SettingsIcon } from "lucide-react";
import { Wordmark } from "@/components/brand";

const LINKS = [
  { href: "/about", label: "How Bitecast works", icon: BookOpenIcon },
  { href: "/about#rankings", label: "How rankings work", icon: ScaleIcon },
  { href: "/about#guidelines", label: "Community guidelines", icon: HeartHandshakeIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

// On every browsing page: the brand, the links that explain how things work, and the one disclaimer
// (scores are users' opinions; no restaurant ties) so pages don't each repeat it.
export function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 w-full max-w-6xl border-t border-hairline px-5 pt-8 lg:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Wordmark />
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">Rate the dish, not the place.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-1 sm:gap-x-12">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="-mx-1.5 inline-flex min-h-10 items-center gap-2 rounded-md px-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Icon aria-hidden className="size-4 shrink-0 text-faint" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-faint">
        Scores, rankings and takes are the personal opinions of people on Bitecast. Bitecast isn&apos;t affiliated with, or paid by, any
        restaurant listed. © Bitecast
      </p>
    </footer>
  );
}
