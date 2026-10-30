import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import PageHeader from "@/components/ui/PageHeader";
import { db } from "@/lib/db";
import { localized } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "page.about"),
    description:
      "MOSCOW — Egyptian streetwear drawn from Moscow's architecture and its winter. Limited runs, heavy denim, oversized cuts.",
    alternates: { canonical: "/about" },
  };
}

const PILLARS = {
  en: [
    {
      n: "01",
      title: "Cold-weather discipline",
      body:
        "Moscow's winter does not forgive a badly made coat. We borrow that standard: heavy fabrics, reinforced seams, hardware that survives being pulled at. Nothing in the line exists because it was cheap to produce.",
    },
    {
      n: "02",
      title: "Architecture, not graphics",
      body:
        "Our silhouettes come from buildings — the weight of a Stalinist facade, the repetition of a metro vault, the cold clarity of glass against snow. Proportion does the talking, so the pieces stay quiet.",
    },
    {
      n: "03",
      title: "Made in limited runs",
      body:
        "Every drop is a fixed number of units. When a size is gone it is marked sold out rather than hidden, because you deserve to see exactly what the drop contained.",
    },
    {
      n: "04",
      title: "Honest sizing",
      body:
        "Each product publishes its own measurement chart, taken flat from the real garment. MOSCOW Fit AI reads those numbers — never a generic chart — and tells you when it does not have enough data to be confident.",
    },
  ],
};

export default async function AboutPage() {
  const locale = "en";
  const t = (k: string) => translate(locale, k);

  const [settings, products] = await Promise.all([db().getSettings(), db().listProducts({})]);
  const pillars = PILLARS.en;

  const storyImage =
    settings.home_story_image ?? products[0]?.images[1]?.url ?? products[0]?.images[0]?.url ?? null;

  return (
    <>
      <PageHeader
        eyebrow="The House"
        title="About MOSCOW"
        subtitle={localized(settings, "tagline", locale)}
        crumbs={[
          { label: "MOSCOW", href: "/" },
          { label: "About MOSCOW" },
        ]}
        tone="ice"
      />

      {/* opening statement */}
      <section className="mw-container py-14 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <Reveal>
            <div>
              <p className="display-md">
                "MOSCOW was built on one idea — that a garment should outlast both the weather and the season that sold it."
              </p>
              <div className="mt-7 space-y-4">
                {(aboutBody.length
                  ? aboutBody
                  : [
                      "We started from a simple observation: local streetwear imports its look from California, while the cities that actually move us are cold, severe and grey. So we took the reference somewhere else — Moscow's facades, its metro vaults, the way light sits on ice.",
                      "Every piece begins as an architectural sketch before it becomes a pattern. We work with local factories that understand heavy denim, and we reject a run when the sample comes back lighter or cheaper than what we agreed.",
                      "The result is a small line, produced in limited numbers, and photographed exactly as it is — no retouching of colour, cut or detail.",
                    ].map((p, i) => (
                  <p key={i} className="text-[15.5px] leading-[1.8] text-ice-700">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </Reveal>

          {storyImage && (
            <Reveal delay={0.1}>
              <div className="relative aspect-4/5 overflow-hidden rounded-lg bg-ice-100">
                <Image
                  src={storyImage}
                  alt="MOSCOW"
                  fill
                  sizes="(max-width:1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* pillars */}
      <section className="border-y border-silver-200 bg-ice-50/60 py-14 sm:py-20">
        <div className="mw-container">
          <h2 className="eyebrow">What we hold to</h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg bg-silver-200 sm:grid-cols-2">
            {pillars.map((p, i) => (
              <Reveal key={p.n} delay={(i % 2) * 0.07}>
                <div className="h-full bg-white p-7 sm:p-9">
                  <span className="font-display text-[13px] tabular-nums tracking-[0.2em] text-ice-400">
                    {p.n}
                  </span>
                  <h3 className="mt-4 font-display text-xl uppercase tracking-tight">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[14.5px] leading-[1.75] text-ice-700">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* closing */}
      <section className="mw-container py-16 text-center sm:py-24">
        <Reveal>
          <p className="eyebrow">A good piece never has to raise its voice.</p>
          <p className="mx-auto mt-5 max-w-2xl display-md">
            "A good piece never has to raise its voice."
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn btn-primary">
              Shop Now
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Contact
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
