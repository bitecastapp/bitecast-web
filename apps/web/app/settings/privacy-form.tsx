"use client";

import { useActionState, useState } from "react";
import { BookOpenIcon, BookmarkIcon, GlobeIcon, LockIcon, UsersRoundIcon } from "lucide-react";
import { VISIBILITIES, type Visibility } from "@/lib/profiles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/toaster";
import { savePrivacy, type PrivacyState } from "./actions";

const ICONS = { everyone: GlobeIcon, followers: UsersRoundIcon, only_me: LockIcon } satisfies Record<Visibility, unknown>;

type Initial = { saves_visibility: Visibility; diary_visibility: Visibility };

const LISTS = [
  {
    name: "saves_visibility",
    label: "Want to try list",
    icon: BookmarkIcon,
    hint: "The dishes you've saved for later.",
  },
  {
    name: "diary_visibility",
    label: "Diary",
    icon: BookOpenIcon,
    hint: "Your rating history by date. Your scores and takes still show on dish pages.",
  },
] as const;

// Who sees your Want to try list and Diary: a three-way switch for each, saved together.
export function PrivacyForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<PrivacyState, FormData>(async (prev, data) => {
    const next = await savePrivacy(prev, data);
    if (next.saved !== prev.saved) toast("Privacy saved");
    return next;
  }, {});
  const [values, setValues] = useState(initial);
  const dirty = values.saves_visibility !== initial.saves_visibility || values.diary_visibility !== initial.diary_visibility;

  return (
    <form action={action} className="flex flex-col gap-5">
      {LISTS.map(({ name, label, icon: Icon, hint }) => (
        <fieldset key={name}>
          <legend className="flex items-center gap-2 text-sm font-semibold">
            <Icon aria-hidden className="size-4 text-mustard" />
            Who can see your {label}
          </legend>
          <p className="mt-1 mb-2.5 text-sm text-muted-foreground">{hint}</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-hairline bg-raised p-1">
            {VISIBILITIES.map((v) => {
              const on = values[name] === v.value;
              const VIcon = ICONS[v.value];
              return (
                <label
                  key={v.value}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
                    on ? "bg-mustard text-studio" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name={name}
                    value={v.value}
                    checked={on}
                    onChange={() => setValues({ ...values, [name]: v.value })}
                    className="sr-only"
                  />
                  <VIcon aria-hidden className="size-3.5 shrink-0" />
                  {v.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending || !dirty}>
          {pending && <Spinner data-icon="inline-start" />}
          Save privacy
        </Button>
        <p className="text-xs text-faint">&ldquo;Followers&rdquo; means people who follow you.</p>
      </div>
      {state.error && <FieldError>{state.error}</FieldError>}
    </form>
  );
}
