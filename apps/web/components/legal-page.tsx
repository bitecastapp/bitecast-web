import { BackLink } from "@/components/back-link";
import { PageShell } from "@/components/page-shell";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

// Terms and Privacy: a contents list beside the text on desktop, one column on phones.
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: React.ReactNode; sections: LegalSection[] }) {
  return (
    <PageShell wide>
      <div className="pb-6">
        <BackLink href="/about" />
        <h1 className="mt-2 text-[1.75rem] leading-tight font-bold tracking-[-0.02em]">{title}</h1>
        <p className="mt-1 text-sm text-faint">Last updated {updated}</p>
        <div className="mt-8 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-14">
          <nav aria-label="Contents" className="hidden lg:sticky lg:top-6 lg:block">
            <p className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">Contents</p>
            <ol className="mt-2 flex flex-col gap-1 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="inline-flex min-h-8 items-center text-muted-foreground hover:text-foreground">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="max-w-3xl">
            <div className="text-[0.9375rem] leading-relaxed text-muted-foreground">{intro}</div>
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mt-8 scroll-mt-6">
                <h2 id={`${s.id}-title`} className="text-lg font-semibold">
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-2 flex flex-col gap-3 text-[0.9375rem] leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
