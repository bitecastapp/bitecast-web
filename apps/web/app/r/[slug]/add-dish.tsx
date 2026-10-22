"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import type { Dish } from "@/lib/restaurants";
import { dishHref, dishKey } from "@/lib/dishes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { addDish, type AddDishState } from "./actions";

type AddDishProps = { restaurantId: string; restaurantSlug: string; restaurantName: string; dishes: Dish[] };

export function AddDish({ restaurantId, restaurantSlug, restaurantName, dishes }: AddDishProps) {
  const [state, action, pending] = useActionState<AddDishState, FormData>(addDish, {});
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [seenState, setSeenState] = useState(state);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep what was typed when the server sends an error back.
  if (state !== seenState) {
    setSeenState(state);
    if (state.name !== undefined) setName(state.name);
  }

  const key = dishKey(name);
  const exact = key ? dishes.find((d) => dishKey(d.name) === key) : undefined;
  const similar = key.length >= 3 && !exact ? dishes.filter((d) => dishKey(d.name).includes(key)).slice(0, 3) : [];
  const serverError = state.error && name === state.name ? state.error : undefined;
  const duplicate = exact ?? (serverError ? state.existing : undefined);

  if (!open) {
    return (
      <Button
        size="xl"
        variant="secondary"
        className="w-full"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <PlusIcon data-icon="inline-start" />
        Add a dish
      </Button>
    );
  }

  return (
    <form action={action} className="flex animate-[rise_420ms_var(--ease-out-expo)_both] flex-col gap-3">
      <input type="hidden" name="restaurant_id" value={restaurantId} />
      <Field data-invalid={Boolean(duplicate || serverError) || undefined}>
        <FieldLabel htmlFor="dish-name">Dish name</FieldLabel>
        <Input
          ref={inputRef}
          id="dish-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoComplete="off"
          placeholder="e.g. Set Dosa"
          aria-invalid={Boolean(duplicate || serverError) || undefined}
          aria-describedby="dish-help"
          className="h-12 bg-raised px-3.5 text-base"
        />
        {duplicate ? (
          <FieldError id="dish-help">
            Already on the menu:{" "}
            <Link href={dishHref(restaurantSlug, duplicate.name)} className="font-semibold underline underline-offset-2">
              {duplicate.name}
            </Link>
          </FieldError>
        ) : serverError ? (
          <FieldError id="dish-help">{serverError}</FieldError>
        ) : similar.length ? (
          <FieldDescription id="dish-help">
            Similar here:{" "}
            {similar.map((d, i) => (
              <span key={d.id}>
                {i > 0 && ", "}
                <Link href={dishHref(restaurantSlug, d.name)} className="font-semibold text-foreground underline underline-offset-2">
                  {d.name}
                </Link>
              </span>
            ))}
          </FieldDescription>
        ) : (
          <FieldDescription id="dish-help">Adds it to {restaurantName}&apos;s menu so people can rate it.</FieldDescription>
        )}
      </Field>
      <div className="flex gap-2">
        <Button type="button" size="xl" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="xl" className="flex-1" disabled={pending || Boolean(exact) || !key}>
          {pending && <Spinner data-icon="inline-start" />}
          {pending ? "Adding" : "Add dish"}
        </Button>
      </div>
    </form>
  );
}
