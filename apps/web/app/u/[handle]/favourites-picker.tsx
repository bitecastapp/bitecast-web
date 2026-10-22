"use client";

import { useRef, useState, useTransition } from "react";
import { PencilIcon, PinIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DishDiet } from "@/lib/diet";
import { DietMark } from "@/components/diet-mark";
import { Score } from "@/components/review-card";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/toaster";
import { saveFavourites } from "./actions";

const MAX = 4;

type Rated = { id: string; score: number; dish: { name: string; diet: DishDiet; restaurant: { name: string } } };

type Props = { rated: Rated[]; pinned: string[]; tiles: React.ReactNode[]; heading: React.ReactNode };

// Your own favourites section: the pinned tiles, empty slots, and one dialog to pin up to 4 from dishes you've rated.
// Lives on the profile itself, not the edit page. The Edit button and every empty slot open the same dialog.
export function OwnFavourites({ rated, pinned, tiles, heading }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [picked, setPicked] = useState(pinned);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function open() {
    setPicked(pinned.filter((id) => rated.some((r) => r.id === id)));
    setError(null);
    dialog.current?.showModal();
  }

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < MAX ? [...p, id] : p));
  }

  return (
    <section aria-labelledby="favourites" className="mt-6">
      <div className="-mr-2 flex items-center justify-between gap-3">
        {heading}
        <button
          type="button"
          onClick={open}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <PencilIcon aria-hidden className="size-3.5" />
          {pinned.length ? "Edit" : "Pin"}
        </button>
      </div>
      <ol className="mt-3 grid grid-cols-4 gap-2.5">
        {tiles}
        {Array.from({ length: MAX - tiles.length }, (_, i) => (
          <li key={`empty-${i}`}>
            <button
              type="button"
              onClick={open}
              className="grid aspect-[3/4] w-full place-items-center rounded-lg border border-dashed border-input text-faint transition-colors hover:border-mustard hover:text-mustard focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <PinIcon aria-hidden className="size-4" />
              <span className="sr-only">Pin a favourite</span>
            </button>
          </li>
        ))}
      </ol>

      <dialog
        ref={dialog}
        aria-labelledby="pick-favourites"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-hairline bg-paper p-0 text-foreground backdrop:animate-[fade-in_200ms_var(--ease-out)] backdrop:bg-studio/80 backdrop:backdrop-blur-sm open:animate-[rise-in_220ms_var(--ease-out)]"
      >
        <div className="flex max-h-[min(40rem,85dvh)] flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-hairline p-4">
            <div>
              <h2 id="pick-favourites" className="font-semibold">
                Pin your favourites
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Up to {MAX}, from dishes you&apos;ve rated. Tap in the order you want them.</p>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <XIcon aria-hidden className="size-4" />
            </button>
          </header>

          {rated.length ? (
            <ul className="flex-1 divide-y divide-hairline overflow-y-auto px-4" aria-label="Dishes you've rated">
              {rated.map((r) => {
                const at = picked.indexOf(r.id);
                const full = at < 0 && picked.length >= MAX;
                return (
                  <li key={r.id}>
                    <label
                      className={cn(
                        "-mx-2 flex min-h-14 items-center gap-3 rounded-lg px-2 py-2 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
                        full ? "opacity-50" : "cursor-pointer hover:bg-muted",
                      )}
                    >
                      <input type="checkbox" checked={at >= 0} disabled={full} onChange={() => toggle(r.id)} className="sr-only" />
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold tabular-nums",
                          at >= 0 ? "border-mustard bg-mustard text-studio" : "border-input",
                        )}
                      >
                        {at >= 0 ? at + 1 : ""}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <DietMark diet={r.dish.diet} className="size-3" />
                          <span className="truncate">{r.dish.name}</span>
                        </span>
                        <span className="block truncate text-sm text-faint">{r.dish.restaurant.name}</span>
                      </span>
                      <Score score={r.score} size={34} />
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">Rate a dish first, then pin it here.</p>
          )}

          <footer className="flex items-center justify-between gap-3 border-t border-hairline p-4">
            <p className="text-sm text-muted-foreground tabular-nums">
              {picked.length}/{MAX} pinned
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="lg" onClick={() => dialog.current?.close()}>
                Cancel
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={saving}
                onClick={() =>
                  startSaving(async () => {
                    const message = await saveFavourites(picked);
                    if (message) setError(message);
                    else {
                      dialog.current?.close();
                      toast("Favourites saved");
                    }
                  })
                }
              >
                {saving && <Spinner data-icon="inline-start" />}
                Save
              </Button>
            </div>
          </footer>
          {error && <FieldError className="px-4 pb-4">{error}</FieldError>}
        </div>
      </dialog>
    </section>
  );
}
