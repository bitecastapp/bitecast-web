"use client";

import { useOptimistic, useRef, useTransition } from "react";
import Link from "next/link";
import { CheckIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGREE_CRUMBS, burst } from "@/lib/burst";
import { setFollow } from "@/app/u/[handle]/actions";
import { toast } from "@/components/toaster";

type Props = { followeeId: string; handle: string; following: boolean; signedIn: boolean };

// Follow / Following. Mustard when you're not following yet; quiet once you are (hover offers Unfollow).
export function FollowButton({ followeeId, handle, following, signedIn }: Props) {
  const [, startTransition] = useTransition();
  const [on, setOn] = useOptimistic(following);
  const fx = useRef<HTMLSpanElement>(null);
  const base =
    "group inline-flex min-h-10 items-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

  if (!signedIn)
    return (
      <Link href="/login" className={cn(base, "bg-mustard text-studio hover:brightness-110")}>
        <PlusIcon aria-hidden className="size-4" strokeWidth={2.5} />
        Follow
      </Link>
    );

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-pressed={on}
        aria-label={on ? `Following @${handle}. Unfollow` : `Follow @${handle}`}
        onClick={(e) => {
          if (!on) burst(fx.current, e.currentTarget, AGREE_CRUMBS);
          startTransition(async () => {
            setOn(!on);
            await setFollow(followeeId, !on);
            toast(on ? `Unfollowed @${handle}` : `Following @${handle}`);
          });
        }}
        className={cn(base, on ? "border border-hairline text-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:border-ketchup/60 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ketchup" : "bg-mustard text-studio hover:brightness-110 active:scale-95")}
      >
        {on ? (
          <>
            <CheckIcon aria-hidden className="size-4 [@media(hover:hover)_and_(pointer:fine)]:group-hover:hidden" strokeWidth={2.5} />
            <span className="[@media(hover:hover)_and_(pointer:fine)]:group-hover:hidden">Following</span>
            <span className="hidden [@media(hover:hover)_and_(pointer:fine)]:group-hover:inline">Unfollow</span>
          </>
        ) : (
          <>
            <PlusIcon aria-hidden className="size-4" strokeWidth={2.5} />
            Follow
          </>
        )}
      </button>
      <span ref={fx} aria-hidden className="pointer-events-none absolute inset-0" />
    </span>
  );
}
