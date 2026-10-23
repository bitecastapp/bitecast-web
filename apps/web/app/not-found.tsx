import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { PageShell } from "@/components/page-shell";

// Any missing page, dish, place, take or person.
export default function NotFound() {
  return (
    <PageShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="grid size-14 animate-[check-pop_480ms_var(--ease-out)_both] place-items-center rounded-full bg-raised">
          <SearchXIcon aria-hidden className="size-6 text-mustard" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">This plate&apos;s empty</h1>
        <p className="max-w-xs text-muted-foreground">We couldn&apos;t find that page. The link may be old, or the dish may have moved.</p>
        <Link
          href="/"
          className="mt-3 inline-flex min-h-11 items-center rounded-md bg-ketchup px-5 font-semibold text-studio hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          Back to the feed
        </Link>
      </div>
    </PageShell>
  );
}
