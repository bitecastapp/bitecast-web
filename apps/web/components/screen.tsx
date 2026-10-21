import { Glasshouse } from "@/components/glasshouse";

type ScreenProps = {
  /** Sign-up step shown in the glasshouse: 1 email, 2 inbox, 3 handle, 4 home, 5 done. */
  step: number;
  children: React.ReactNode;
};

// Every screen: wordmark, the glasshouse, then the screen's content (side by side on desktop).
export function Screen({ step, children }: ScreenProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] md:grid md:grid-cols-2 md:items-center md:gap-16 md:px-12">
      <div className="flex flex-col gap-6 md:gap-12">
        <header>
          <span className="text-xl font-extrabold tracking-tight">bitecast</span>
        </header>
        <Glasshouse step={step} />
      </div>
      <div className="mt-7 flex flex-1 flex-col md:mt-0 md:max-w-sm md:flex-none">{children}</div>
    </main>
  );
}
