"use client";

import { useActionState } from "react";
import { ArrowRightIcon, CheckIcon, MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { joinWaitlist, type WaitlistState } from "./actions";

export function WaitlistForm() {
  const [state, action, pending] = useActionState<WaitlistState, FormData>(joinWaitlist, {});

  if (state.joined)
    return (
      <div role="status" className="flex animate-[rise-in_320ms_var(--ease-out)] items-start gap-3 rounded-2xl border border-mustard/40 bg-mustard/10 p-4 text-left">
        <span className="grid size-9 shrink-0 animate-[check-pop_420ms_var(--ease-out)_120ms_both] place-items-center rounded-full bg-mustard text-studio">
          <CheckIcon aria-hidden className="size-5" strokeWidth={3} />
        </span>
        <div>
          <p className="font-semibold">You&apos;re on the list!</p>
          <p className="mt-0.5 text-sm text-muted-foreground">We&apos;ll email you the moment Nomrank opens. Bring your appetite.</p>
        </div>
      </div>
    );

  return (
    <form action={action} noValidate className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          Email
        </label>
        <div className="relative flex-1">
          <MailIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="waitlist-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            defaultValue={state.email}
            placeholder="you@example.com"
            aria-invalid={state.error ? true : undefined}
            aria-describedby="waitlist-note"
            className="h-12 bg-raised pr-3.5 pl-10 text-base"
          />
        </div>
        <Button type="submit" size="xl" disabled={pending} className="sm:min-h-12">
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Join the waitlist
          {!pending && <ArrowRightIcon data-icon="inline-end" />}
        </Button>
      </div>
      {/* Honeypot: off-screen and skipped by keyboard and screen readers; only bots fill it in. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />
      <p id="waitlist-note" role={state.error ? "alert" : undefined} className={state.error ? "text-sm text-destructive" : "text-sm text-faint"}>
        {state.error ?? "No spam. One email when we open the doors."}
      </p>
    </form>
  );
}
