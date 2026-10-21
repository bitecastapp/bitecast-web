"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Screen } from "@/components/screen";
import { usernameSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { createProfile, type OnboardingState } from "./actions";

export type Region = { slug: string; name: string };

export function OnboardingForm({ regions }: { regions: Region[] }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createProfile, {});
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string>();
  const [region, setRegion] = useState(regions.length === 1 ? regions[0].slug : "");
  const [seenState, setSeenState] = useState(state);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  // A server error about the handle sends you back to step 1 with the message.
  if (state !== seenState) {
    setSeenState(state);
    if (state.error?.field === "username") {
      setStep(1);
      setUsernameError(state.error.message);
    }
  }

  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
    mounted.current = true;
  }, [step]);

  function next() {
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) return setUsernameError(parsed.error.issues[0].message);
    setUsernameError(undefined);
    setStep(2);
  }

  return (
    <Screen step={step + 2}>
      <form
        action={action}
        onSubmit={(e) => {
          if (step === 1) {
            e.preventDefault();
            next();
          }
        }}
        className="flex flex-1 flex-col"
        noValidate
      >
        <div key={step} className="flex flex-1 animate-[rise_420ms_var(--ease-out-expo)_both] flex-col gap-6">
          {step === 1 ? (
            <>
              <div className="flex flex-col gap-3">
                <h1 ref={headingRef} tabIndex={-1} className="text-[2rem] leading-tight font-extrabold tracking-tight outline-none">
                  Pick your handle
                </h1>
                <p className="text-muted-foreground">It&apos;s how you show up on every dish you rate.</p>
              </div>
              <FieldGroup>
                <Field data-invalid={usernameError ? true : undefined}>
                  <FieldLabel htmlFor="username">Handle</FieldLabel>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameError(undefined);
                    }}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={21}
                    placeholder="dosa_devotee"
                    aria-invalid={usernameError ? true : undefined}
                    aria-describedby="username-help"
                    className="h-13 bg-glass px-3.5 text-base"
                  />
                  {usernameError ? (
                    <FieldError id="username-help">{usernameError}</FieldError>
                  ) : (
                    <FieldDescription id="username-help">3–20 letters, numbers or _.</FieldDescription>
                  )}
                </Field>
              </FieldGroup>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <h1 ref={headingRef} tabIndex={-1} className="text-[2rem] leading-tight font-extrabold tracking-tight outline-none">
                  Where&apos;s home?
                </h1>
                <p className="text-muted-foreground">
                  Where you grew up eating. When a dish comes from there, your rating counts toward its
                  Tastes&nbsp;like&nbsp;home score.
                </p>
              </div>
              <FieldSet data-invalid={state.error?.field === "region" || undefined}>
                <FieldLegend className="sr-only">Home</FieldLegend>
                <div className="flex flex-col gap-2">
                  {regions.map((r) => (
                    <label
                      key={r.slug}
                      className={cn(
                        "flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 text-base font-semibold transition-colors duration-200 has-focus-visible:ring-3 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background",
                        region === r.slug ? "border-primary bg-pane-live" : "border-input bg-glass hover:bg-muted",
                      )}
                    >
                      <input
                        type="radio"
                        name="region"
                        value={r.slug}
                        checked={region === r.slug}
                        onChange={() => setRegion(r.slug)}
                        className="sr-only"
                      />
                      {r.name}
                      <CheckIcon
                        aria-hidden
                        className={cn("size-5 shrink-0 text-primary transition-opacity", region === r.slug ? "opacity-100" : "opacity-0")}
                      />
                    </label>
                  ))}
                </div>
                {regions.length === 0 ? (
                  <FieldError>Couldn&apos;t load places. Refresh the page to try again.</FieldError>
                ) : state.error?.field === "region" ? (
                  <FieldError>{state.error.message}</FieldError>
                ) : (
                  <FieldDescription>More places are coming soon.</FieldDescription>
                )}
              </FieldSet>
              {state.error?.field === "form" && (
                <p role="alert" className="text-sm text-destructive">
                  {state.error.message}
                </p>
              )}
            </>
          )}
        </div>

        <input type="hidden" name="username" value={username} />
        <div className="mt-8 flex gap-2">
          {step === 2 && (
            <Button type="button" size="xl" variant="ghost" onClick={() => setStep(1)} disabled={pending}>
              <ArrowLeftIcon data-icon="inline-start" />
              Back
            </Button>
          )}
          <Button type="submit" size="xl" className="flex-1" disabled={pending || (step === 2 && regions.length === 0)}>
            {step === 1 ? "Next" : pending ? "Saving" : "Let's eat"}
            {pending ? <Spinner data-icon="inline-end" /> : step === 1 && <ArrowRightIcon data-icon="inline-end" />}
          </Button>
        </div>
      </form>
    </Screen>
  );
}
