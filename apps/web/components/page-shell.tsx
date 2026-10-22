import { ViewTransition } from "react";
import { Wordmark } from "@/components/brand";

// Shell for browsing screens: wordmark (+ an optional header action), then one readable column.
export function PageShell({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pt-[max(env(safe-area-inset-top),0.75rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <header className="flex h-12 items-center justify-between gap-3">
        <Wordmark />
        {action}
      </header>
      {/* Content rises in on arrival; default="none" keeps it still during unrelated transitions (e.g. tab switches). */}
      <ViewTransition enter="rise" default="none">
        <div className="mt-3 flex flex-1 flex-col">{children}</div>
      </ViewTransition>
    </main>
  );
}
