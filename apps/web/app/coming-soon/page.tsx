import type { Metadata } from "next";
import Link from "next/link";
import { HouseHeartIcon, MessageCircleIcon, TrophyIcon } from "lucide-react";
import { BroadcastMark, Wordmark } from "@/components/brand";
import { WaitlistForm } from "./waitlist-form";

export const metadata: Metadata = {
  title: "Nomrank · Coming soon",
  description: "Rate the dish, not the place. Nomrank is almost ready: join the waitlist and be first in.",
};

const TEASERS = [
  { icon: MessageCircleIcon, title: "Score every dish", text: "Rate dishes 1 to 10 with a hot take and photos. Others agree, disagree and reply." },
  { icon: TrophyIcon, title: "Rankings per food", text: "Top Dosa, Top Biryani and more, ranked by the people who actually ate them." },
  { icon: HouseHeartIcon, title: "Tastes like home", text: "See how people from a dish's home region rate it." },
];

// The pre-launch landing page, shown on the main domain while COMING_SOON=1 (see proxy.ts).
export default function ComingSoonPage() {
  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-hidden px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      {/* A soft ketchup-to-mustard glow behind the hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--ketchup), var(--mustard) 55%, transparent)" }}
      />

      <header className="relative mx-auto flex h-12 w-full max-w-5xl items-center">
        <Wordmark href={null} />
      </header>

      <section className="stagger relative mx-auto mt-[10dvh] flex w-full max-w-xl flex-col items-center text-center">
        <span className="relative grid size-20 place-items-center">
          <span aria-hidden className="absolute inset-0 animate-[ping-ring_1.8s_var(--ease-out)_infinite] rounded-full border-2 border-ketchup/40" />
          <BroadcastMark lit={3} pulse className="relative w-14" />
        </span>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-paper px-3 py-1 text-xs font-semibold tracking-[0.08em] text-mustard uppercase">
          <span aria-hidden className="size-1.5 animate-[on-air_1.6s_ease-in-out_infinite] rounded-full bg-ketchup" />
          Coming soon
        </p>
        <h1 className="mt-4 text-[2.5rem] leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-6xl">
          Rate the dish,
          <br />
          not the place.
        </h1>
        <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-muted-foreground">
          Nomrank is where food lovers score individual dishes, argue about the takes, and find what&apos;s actually worth eating. We&apos;re
          plating up. Get on the list and be first in.
        </p>
        <div className="mt-8 w-full">
          <WaitlistForm />
        </div>
      </section>

      <ul className="stagger relative mx-auto mt-16 grid w-full max-w-5xl gap-3 sm:grid-cols-3">
        {TEASERS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-2xl border border-hairline bg-paper/80 p-4 sm:p-5">
            <span className="grid size-9 place-items-center rounded-lg bg-mustard/12 text-mustard">
              <Icon aria-hidden className="size-[18px]" />
            </span>
            <p className="mt-3 font-semibold">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>

      <footer className="relative mx-auto mt-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-1 pt-14 text-xs text-faint">
        <Link href="/about" className="inline-flex min-h-10 items-center hover:text-foreground">
          How Nomrank works
        </Link>
        <Link href="/terms" className="inline-flex min-h-10 items-center hover:text-foreground">
          Terms
        </Link>
        <Link href="/privacy" className="inline-flex min-h-10 items-center hover:text-foreground">
          Privacy
        </Link>
        <span>© Nomrank</span>
      </footer>
    </main>
  );
}
