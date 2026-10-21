import Link from "next/link";

// Shell for browsing screens: wordmark home link, then a single readable column.
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-6 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <header className="flex h-11 items-center">
        <Link href="/" className="-mx-1 rounded-md px-1 text-xl font-extrabold tracking-tight">
          bitecast
        </Link>
      </header>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </main>
  );
}
