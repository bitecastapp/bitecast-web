"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";
import type { DishDetail } from "@/lib/restaurants";
import { formatScore, photoUrl, scoreColor, verdict } from "@/lib/ratings";
import { resizeToJpeg } from "@/lib/resize-image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { saveRating, type SaveRatingState } from "@/app/rating-actions";

type Existing = { score: number; take: string | null; photos: string[] } | null;
type Photo = { key: string; path?: string; file?: File; preview: string };
const MAX_TAKE = 500;

export function RateForm({ dish, userId, existing }: { dish: DishDetail; userId: string; existing: Existing }) {
  const [state, action, pending] = useActionState<SaveRatingState, FormData>(saveRating, {});
  const [score, setScore] = useState(existing?.score ?? 0);
  const [take, setTake] = useState(existing?.take ?? "");
  const [photos, setPhotos] = useState<Photo[]>(() => (existing?.photos ?? []).map((path) => ({ key: path, path, preview: photoUrl(path) })));
  const [photosChanged, setPhotosChanged] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = pending || uploading;

  function addFiles(files: FileList | null) {
    const room = 4 - photos.length;
    const picked = [...(files ?? [])].filter((f) => f.type.startsWith("image/")).slice(0, room);
    setPhotos((p) => [...p, ...picked.map((file) => ({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))]);
    if (picked.length) setPhotosChanged(true);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!score) return setLocalError("Pick a score from 1 to 10.");
    setLocalError(undefined);
    const fd = new FormData(e.currentTarget);
    if (photosChanged) {
      setUploading(true);
      try {
        const supabase = createClient();
        const paths = await Promise.all(
          photos.map(async (p) => {
            if (p.path) return p.path;
            const path = `${userId}/${crypto.randomUUID()}.jpg`;
            const { error } = await supabase.storage.from("rating-photos").upload(path, await resizeToJpeg(p.file!), { contentType: "image/jpeg" });
            if (error) throw error;
            return path;
          }),
        );
        fd.set("photos_sent", "1");
        paths.forEach((path) => fd.append("photo", path));
      } catch {
        setUploading(false);
        return setLocalError("A photo didn't upload. Check your connection and try again.");
      }
      setUploading(false);
    }
    startTransition(() => action(fd));
  }

  const error = localError ?? state.error;
  return (
    <form onSubmit={submit} className="flex flex-col gap-7 pb-6">
      <input type="hidden" name="dish_id" value={dish.id} />

      <ScoreMeter score={score} onChange={setScore} />

      <Field>
        <FieldLabel htmlFor="take" className="font-semibold">
          Hot take <span className="font-medium text-muted-foreground">(optional)</span>
        </FieldLabel>
        <textarea
          id="take"
          name="take"
          value={take}
          onChange={(e) => setTake(e.target.value.slice(0, MAX_TAKE))}
          rows={4}
          placeholder="What did you think?"
          aria-describedby="take-count"
          className="w-full rounded-md border border-input bg-raised px-3.5 py-3 text-base leading-relaxed focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
        <p id="take-count" className="text-right text-sm text-muted-foreground tabular-nums">
          {take.length}/{MAX_TAKE}
        </p>
      </Field>

      <div>
        <p className="mb-3 text-sm font-semibold">
          Photos <span className="font-medium text-muted-foreground">(up to 4)</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <span key={p.key} className="relative size-20 overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element -- local previews and Storage URLs */}
              <img src={p.preview} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPhotos((all) => all.filter((x) => x.key !== p.key));
                  setPhotosChanged(true);
                }}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-studio/85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <XIcon className="size-4" />
              </button>
            </span>
          ))}
          {photos.length < 4 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid size-20 place-items-center rounded-md border border-dashed border-input text-muted-foreground hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ImagePlusIcon className="size-6" />
              <span className="sr-only">Add photos</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      {error && <FieldError className="text-base">{error}</FieldError>}

      <Button type="submit" size="xl" className="w-full" disabled={busy}>
        {busy && <Spinner data-icon="inline-start" />}
        {uploading ? "Uploading photos" : pending ? "Posting" : take.trim() ? "Post it" : "Save score"}
      </Button>
    </form>
  );
}

const STEPS = Array.from({ length: 19 }, (_, i) => 1 + i / 2); // 1, 1.5 … 10

// The score as a signal meter: 19 rising bars (half steps) that light up ketchup-to-mustard as you go.
// A transparent range input covers the bars, so tapping, dragging and arrow keys all pick a score.
function ScoreMeter({ score, onChange }: { score: number; onChange: (n: number) => void }) {
  const [from, setFrom] = useState(score);
  const pick = (n: number) => {
    setFrom(score);
    onChange(n);
  };
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <label htmlFor="score" className="text-sm font-semibold">
          Your score
        </label>
        <span aria-hidden className="flex items-baseline gap-2">
          {score > 0 && <span className="text-sm font-semibold text-muted-foreground">{verdict(score).label}</span>}
          <span className="inline-flex overflow-hidden text-3xl leading-none font-bold tabular-nums">
            <span
              key={score}
              className={cn(score ? "animate-[roll-up_180ms_var(--ease-out)] bg-(image:--score-gradient) bg-clip-text text-transparent" : "text-faint")}
            >
              {score ? formatScore(score) : "–"}
            </span>
            <span className="self-end text-base font-semibold text-faint">/10</span>
          </span>
        </span>
      </div>
      <div className="relative rounded-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-4 has-[:focus-visible]:ring-offset-background">
        <div aria-hidden className="flex h-32 items-end gap-1">
          {STEPS.map((v) => {
            const lit = v <= score;
            // Bars that change state ripple outward from the previous score, 12ms per half step.
            const changed = (v > from && v <= score) || (v > score && v <= from);
            const delay = changed ? Math.abs(v - from) * 24 : 0;
            return (
              <span
                key={v}
                className={cn("flex-1 rounded-t-[3px] transition-colors duration-150 ease-[var(--ease-out)]", !lit && "bg-raised")}
                style={{
                  height: `${v * 10}%`,
                  transitionDelay: `${delay}ms`,
                  backgroundColor: lit ? scoreColor(v) : undefined,
                }}
              />
            );
          })}
        </div>
        <input
          id="score"
          type="range"
          name={score ? "score" : undefined}
          min={1}
          max={10}
          step={0.5}
          value={score || 1}
          aria-valuetext={score ? `${formatScore(score)} out of 10, ${verdict(score).label}` : "Not scored yet"}
          onChange={(e) => pick(Number(e.target.value))}
          // The first tap on 1 doesn't change the input's value, so it fires no change event.
          onClick={(e) => !score && pick(Number(e.currentTarget.value))}
          className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0 [&::-moz-range-thumb]:size-px [&::-webkit-slider-thumb]:size-px [&::-webkit-slider-thumb]:appearance-none"
        />
      </div>
      <div aria-hidden className="mt-1.5 flex gap-1 text-center text-xs text-faint tabular-nums">
        {STEPS.map((v) => (
          <span key={v} className={cn("flex-1", Math.floor(score) === v && "font-semibold text-foreground")}>
            {Number.isInteger(v) ? v : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
