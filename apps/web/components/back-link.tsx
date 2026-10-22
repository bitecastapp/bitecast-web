"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { canGoBack, visit } from "@/lib/history";

// Paths visited inside the app since this page load. Module state, so a fresh tab or a reload starts empty.
let stack: string[] = [];

// Mounted once in the root layout: tracks in-app history so Back knows whether there's somewhere to go back to.
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    stack = visit(stack, pathname);
  }, [pathname]);
  return null;
}

// "Back" goes to wherever you came from in the app. With nothing to go back to (a shared link), or when the
// page before was a form you submitted, it goes to `href`: the page's logical parent.
export function BackLink({ href }: { href: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || !canGoBack(stack)) return;
        e.preventDefault();
        router.back();
      }}
      className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-md pr-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ChevronLeftIcon aria-hidden className="size-4 shrink-0" />
      Back
    </Link>
  );
}
