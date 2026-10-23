"use client";

import Link from "next/link";
import { FlameIcon, RotateCcwIcon } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";

// Something failed while loading a page: say so plainly and offer a retry. (A client component, so it can't use the
// server PageShell; it keeps the same header and spacing.)
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh w-full flex-col px-5 pt-[max(env(safe-area-inset-top),0.75rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <header className="mx-auto flex h-12 w-full max-w-6xl items-center lg:h-16">
        <Wordmark />
      </header>
      <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="grid size-14 animate-[check-pop_480ms_var(--ease-out)_both] place-items-center rounded-full bg-raised">
          <FlameIcon aria-hidden className="size-6 text-ketchup" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Something got burnt</h1>
        <p className="max-w-xs text-muted-foreground">This page didn&apos;t load. Check your connection and try again.</p>
        <div className="mt-3 flex gap-2">
          <Button type="button" size="xl" onClick={reset}>
            <RotateCcwIcon data-icon="inline-start" />
            Try again
          </Button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center rounded-md border border-hairline px-5 font-semibold hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
