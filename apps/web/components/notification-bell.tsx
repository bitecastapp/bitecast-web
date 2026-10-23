import Link from "next/link";
import { BellIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// The header bell: a count badge when there's something new, and one small ring as the page arrives (not a loop).
export function NotificationBell({ unread }: { unread: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
      className="relative grid size-10 place-items-center rounded-full border border-hairline bg-raised text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <BellIcon aria-hidden className={cn("size-[18px] origin-top", unread > 0 && "animate-[bell-ring_900ms_var(--ease-out)_400ms_both] text-foreground")} />
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 grid h-5 min-w-5 animate-[check-pop_420ms_var(--ease-out)_200ms_both] place-items-center rounded-full bg-ketchup px-1 text-[0.6875rem] font-bold text-studio tabular-nums ring-2 ring-background"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
