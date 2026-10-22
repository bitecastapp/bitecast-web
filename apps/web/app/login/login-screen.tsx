"use client";

import { Suspense, useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Screen } from "@/components/screen";
import { sendLink, type LoginState } from "./actions";

export function LoginScreen({ initialState = { status: "idle" } }: { initialState?: LoginState }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendLink, initialState);
  const [dismissed, setDismissed] = useState<LoginState | null>(null);
  const sent = state.status === "sent" && state !== dismissed;
  const sentHeading = useRef<HTMLHeadingElement>(null);

  // Move focus to the confirmation so screen readers announce it.
  useEffect(() => {
    if (sent) sentHeading.current?.focus();
  }, [sent]);

  return (
    <Screen step={sent ? 2 : 1}>
      {sent ? (
        <div key="sent" className="flex flex-1 animate-[rise_500ms_var(--ease-out-expo)_both] flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 ref={sentHeading} tabIndex={-1} className="text-2xl leading-tight font-bold tracking-tight outline-none">
              Check your inbox
            </h1>
            <p className="text-muted-foreground">
              We sent a sign-in link to <span className="font-semibold wrap-anywhere text-foreground">{state.email}</span>.
              Open it on this phone to get in.
            </p>
            <p className="text-sm text-muted-foreground">Nothing after a minute? Check spam, or send it again.</p>
          </div>
          <div className="mt-auto flex flex-col gap-2 md:mt-2">
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
        <form key="form" action={action} className="flex flex-1 flex-col gap-6" noValidate>
          <div className="flex flex-col gap-3">
            <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.02em]">
              Rate the <span className="text-mustard">dish</span>,<br />
              not the place.
            </h1>
            <p className="text-muted-foreground">A dish-by-dish guide to what&apos;s actually worth eating.</p>
          </div>
          <Suspense>
            <LinkError />
          </Suspense>
          <FieldGroup className="mt-auto md:mt-2">
            <Field data-invalid={state.status === "error" || undefined}>
              <FieldLabel htmlFor="email">Your email</FieldLabel>
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
                className="h-12 bg-raised px-3.5 text-base"
              />
              {state.status === "error" ? (
                <FieldError id="email-error">{state.message}</FieldError>
              ) : (
                <FieldDescription id="email-hint">We&apos;ll email you a link. No password needed.</FieldDescription>
              )}
            </Field>
            <Button type="submit" size="xl" className="w-full" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : <MailIcon data-icon="inline-start" />}
              {pending ? "Sending" : "Send my link"}
            </Button>
          </FieldGroup>
        </form>
      )}
    </Screen>
  );
}

// Reads the URL, so it streams in on its own while the rest of the screen prerenders.
function LinkError() {
  if (useSearchParams().get("error") !== "link") return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
      That link expired or was already used. Send yourself a fresh one.
    </p>
  );
}
