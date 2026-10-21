import { Plate } from "@/components/plate";

type ScreenProps = {
  board: React.ReactNode;
  children: React.ReactNode;
};

// Every screen: the pitch-green scoreboard on top (left on desktop), the scorecard sheet below (right).
export function Screen({ board, children }: ScreenProps) {
  return (
    <main className="flex min-h-dvh flex-col md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(400px,1fr)]">
      <section className="flex flex-col gap-8 bg-board px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-12 text-board-ink md:min-h-dvh md:justify-between md:px-12 md:py-12">
        <header className="flex items-center justify-between">
          <span className="font-display text-xl font-bold tracking-[0.18em] text-plate uppercase">
            Bitecast
          </span>
          <Plate className="text-sm tracking-[0.06em]" aria-label="Bengaluru">
            BLR
          </Plate>
        </header>
        <div className="flex flex-col gap-5">{board}</div>
      </section>
      <section className="-mt-5 flex flex-1 animate-[sheet-up_560ms_var(--ease-out-expo)_both] flex-col rounded-t-[20px] bg-background px-5 pt-8 pb-[max(env(safe-area-inset-bottom),1.5rem)] md:mt-0 md:animate-none md:justify-center md:rounded-none md:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col md:flex-none">{children}</div>
      </section>
    </main>
  );
}

// Lines of plates for the board headline. Each word is its own tin.
export function PlateLine({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex flex-wrap gap-[0.12em] text-[clamp(2.75rem,13.5vw,5.25rem)] md:text-[clamp(3.5rem,6.2vw,6rem)]">
      {children}
    </span>
  );
}
