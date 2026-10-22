"use client";

import { useRef, useTransition } from "react";
import Link from "next/link";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { deleteRating } from "@/app/rating-actions";

// Your own take: edit it (back to the rate form) or delete it, after a clear "are you sure".
export function TakeActions({ ratingId, dishId }: { ratingId: string; dishId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [deleting, startDelete] = useTransition();
  const btn =
    "inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
  return (
    <>
      <Link href={`/rate?dish=${dishId}`} className={btn}>
        <PencilIcon aria-hidden className="size-3.5" />
        Edit
      </Link>
      <button type="button" onClick={() => dialog.current?.showModal()} className={`${btn} hover:text-ketchup`}>
        <Trash2Icon aria-hidden className="size-3.5" />
        Delete
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="delete-take"
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-hairline bg-paper p-5 text-foreground backdrop:animate-[fade-in_200ms_var(--ease-out)] backdrop:bg-studio/80 backdrop:backdrop-blur-sm open:animate-[rise-in_220ms_var(--ease-out)]"
      >
        <h2 id="delete-take" className="text-lg font-semibold">
          Delete this take?
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your score, words and photos go, along with its votes and comments. This can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="lg" onClick={() => dialog.current?.close()} disabled={deleting}>
            Keep it
          </Button>
          <Button type="button" size="lg" variant="destructive" disabled={deleting} onClick={() => startDelete(() => deleteRating(ratingId))}>
            {deleting && <Spinner data-icon="inline-start" />}
            Delete take
          </Button>
        </div>
      </dialog>
    </>
  );
}
