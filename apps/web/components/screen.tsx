import { BroadcastMark, Wordmark } from "@/components/brand";

type ScreenProps = {
  /** Sign-up step: 1 email, 2 inbox, 3 handle, 4 home, 5 done. Each finished step lights a wave. */
  step: number;
  children: React.ReactNode;
};

// Sign-up screens: wordmark, a small broadcast mark whose waves show progress, then the content.
export function Screen({ step, children }: ScreenProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <header className="flex h-11 items-center justify-between">
        <Wordmark />
        <BroadcastMark lit={Math.min(step - 1, 3)} className="w-9" />
      </header>
      <div className="mt-[12dvh] flex flex-1 flex-col">{children}</div>
    </main>
  );
}
