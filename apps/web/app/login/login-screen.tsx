"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { SwapPlate } from "@/components/plate";
import { PlateLine, Screen } from "@/components/screen";
import { sendLink, type LoginState } from "./actions";

const BOARD = {
  idle: [
    ["Rate", "the", "dish,"],
    ["not", "the", "place."],
  ],
  sent: [
    ["Link's", "on", "its"],
    ["way", "to", "you."],
  ],
};

export function LoginScreen() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendLink, { status: "idle" });
  const [dismissed, setDismissed] = useState<LoginState | null>(null);
  const sent = state.status === "sent" && state !== dismissed;
  const lines = sent ? BOARD.sent : BOARD.idle;

  return (
    <Screen
      board={
        <>
          <p className="sr-only">{sent ? "Link's on its way to you." : "Rate the dish, not the place."}</p>
          <div aria-hidden className="flex flex-col gap-[0.12em]">
            {lines.map((words, row) => (
              <PlateLine key={row}>
                {words.map((word, i) => (
                  <SwapPlate
                    key={i}
                    value={word}
                    live={row === 1 && i === 2}
                    style={{ animationDelay: `${(row * 3 + i) * 45}ms` }}
                  />
                ))}
              </PlateLine>
            ))}
          </div>
          <p className="max-w-[32ch] text-base text-board-ink">
            Bengaluru&apos;s scoreboard for what&apos;s actually worth eating, one dish at a time.
          </p>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-1 flex-col gap-6" aria-live="polite">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
            <p className="text-muted-foreground">
              We sent a sign-in link to <span className="font-medium break-all text-foreground">{state.email}</span>.
              Open it on this phone to get in.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">Nothing after a minute? Check spam, or send it again.</p>
          <div className="mt-auto flex flex-col gap-2 md:mt-0">
            <form action={action}>
              <input type="hidden" name="email" value={state.email} />
              <Button type="submit" size="xl" variant="secondary" className="w-full" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                Send it again
              </Button>
            </form>
            <Button size="xl" variant="ghost" className="w-full" onClick={() => setDismissed(state)}>
              Use a different email
            </Button>
          </div>
        </div>
      ) : (
        <form action={action} className="flex flex-1 flex-col gap-6" noValidate>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Get in</h1>
            <p className="text-muted-foreground">New here or back for more, it&apos;s the same email link. No password.</p>
          </div>
          <Suspense>
            <LinkError />
          </Suspense>
          <FieldGroup>
            <Field data-invalid={state.status === "error" || undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@example.com"
                defaultValue={state.status === "error" || state.status === "sent" ? state.email : ""}
                aria-invalid={state.status === "error" || undefined}
                aria-describedby={state.status === "error" ? "email-error" : "email-hint"}
                required
                className="h-13 px-3.5 text-base"
              />
              {state.status === "error" ? (
                <FieldError id="email-error">{state.message}</FieldError>
              ) : (
                <FieldDescription id="email-hint">We&apos;ll email you a link. Open it on this phone.</FieldDescription>
              )}
            </Field>
          </FieldGroup>
          <Button type="submit" size="xl" className="mt-auto w-full md:mt-0" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <MailIcon data-icon="inline-start" />}
            {pending ? "Sending" : "Send my link"}
          </Button>
        </form>
      )}
    </Screen>
  );
}

// Reads the URL, so it streams in on its own while the rest of the screen prerenders.
function LinkError() {
  if (useSearchParams().get("error") !== "link") return null;
  return (
    <p role="alert" className="rounded-md bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
      That link expired or was already used. Send yourself a fresh one.
    </p>
  );
}
