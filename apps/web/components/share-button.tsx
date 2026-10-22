"use client";

import { useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/toaster";

// Share a page: the phone's share sheet where there is one, otherwise copy the link.
export function ShareButton({ path, title, className }: { path: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Closing the share sheet isn't an error worth showing.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url); // clipboard blocked: let them copy it by hand
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? "Link copied" : "Share profile"}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-md border border-hairline text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      {copied ? <CheckIcon aria-hidden className="size-4 animate-[check-pop_420ms_var(--ease-out)_both] text-mustard" /> : <Share2Icon aria-hidden className="size-4" />}
    </button>
  );
}
