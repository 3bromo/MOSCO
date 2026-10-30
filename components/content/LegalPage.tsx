import Reveal from "@/components/motion/Reveal";
import PageHeader from "@/components/ui/PageHeader";
import type { Block } from "@/lib/content/pages";

export default function LegalPage({
  eyebrow,
  title,
  subtitle,
  updated,
  blocks,
  crumbs,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  updated?: string;
  blocks: Block[];
  crumbs: { label: string; href?: string }[];
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} crumbs={crumbs} />

      <div className="mw-container py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[200px_1fr] lg:gap-16">
          {/* jump list */}
          <nav
            aria-label={title}
            className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:mx-0 lg:block lg:self-start lg:overflow-visible lg:px-0"
          >
            {blocks.map((b, i) => (
              <a
                key={i}
                href={`#s${i}`}
                className="link-underline block shrink-0 py-1.5 text-[13px] text-ice-600 hover:text-ice-900"
              >
                {b.heading}
              </a>
            ))}
          </nav>

          <div className="min-w-0">
            {updated && (
              <p className="mb-8 text-[12.5px] uppercase tracking-[0.12em] text-ice-500">
                {updated}
              </p>
            )}
            <div className="space-y-11">
              {blocks.map((b, i) => (
                <Reveal key={i} delay={Math.min(i, 4) * 0.04}>
                  <section id={`s${i}`} className="scroll-mt-[calc(var(--header-h)+24px)]">
                    <h2 className="font-display text-xl uppercase tracking-tight sm:text-2xl">
                      {b.heading}
                    </h2>
                    <div className="mt-4 space-y-3.5">
                      {b.body.map((p, j) => (
                        <p key={j} className="text-[15px] leading-[1.75] text-ice-700">
                          {p}
                        </p>
                      ))}
                    </div>
                  </section>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
