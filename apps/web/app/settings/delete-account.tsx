"use client";

import { useActionState, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { deleteAccount, type DeleteAccountState } from "./actions";

// Deleting is permanent, so it takes two deliberate steps: open the box, then type your handle.
export function DeleteAccount({ handle }: { handle: string }) {
  const [state, action, pending] = useActionState<DeleteAccountState, FormData>(deleteAccount, {});
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim().replace(/^@/, "").toLowerCase() === handle;

  return (
    <div className="rounded-2xl border border-destructive/40 p-4 sm:p-5">
      <p className="font-semibold">Delete your account</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Removes your profile, ratings, takes, photos, comments, votes, favourites, follows and saved dishes. This can&apos;t be undone.
      </p>
      {!open ? (
        <Button type="button" variant="destructive" size="lg" className="mt-4" onClick={() => setOpen(true)}>
          <Trash2Icon data-icon="inline-start" />
          Delete account
        </Button>
      ) : (
        <form action={action} className="mt-4 flex flex-col gap-3">
          <Field data-invalid={Boolean(state.error) || undefined}>
            <FieldLabel htmlFor="confirm" className="font-semibold">
              Type <span className="font-mono text-foreground">{handle}</span> to confirm
            </FieldLabel>
            <Input
              id="confirm"
              name="confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(state.error) || undefined}
              className="h-12 bg-raised px-3.5 text-base"
            />
            {state.error && <FieldError>{state.error}</FieldError>}
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="lg" onClick={() => setOpen(false)} disabled={pending}>
              Keep my account
            </Button>
            <Button type="submit" variant="destructive" size="lg" disabled={!matches || pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Delete forever
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
