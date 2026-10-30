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
      locale === "ar"
        ? "موسكو — ستريت وير مصري مستوحى من عمارة موسكو وشتائها. إصدارات محدودة، دنيم ثقيل، وقصّات واسعة."
        : "MOSCOW — Egyptian streetwear drawn from Moscow's architecture and its winter. Limited runs, heavy denim, oversized cuts.",
    alternates: { canonical: "/about" },
  };
}

const PILLARS = {
  en: [
    {
      n: "01",
      title: "Cold-weather discipline",
      body: "Moscow's winter does not forgive a badly made coat. We borrow that standard: heavy fabrics, reinforced seams, hardware that survives being pulled at. Nothing in the line exists because it was cheap to produce.",
    },
    {
      n: "02",
      title: "Architecture, not graphics",
      body: "Our silhouettes come from buildings — the weight of a Stalinist facade, the repetition of a metro vault, the cold clarity of glass against snow. Proportion does the talking, so the pieces stay quiet.",
    },
    {
      n: "03",
      title: "Made in limited runs",
      body: "Every drop is a fixed number of units. When a size is gone it is marked sold out rather than hidden, because you deserve to see exactly what the drop contained.",
    },
    {
      n: "04",
      title: "Honest sizing",
      body: "Each product publishes its own measurement chart, taken flat from the real garment. MOSCOW Fit AI reads those numbers — never a generic chart — and tells you when it does not have enough data to be confident.",
    },
  ],
  ar: [
    {
      n: "٠١",
      title: "انضباط الشتاء",
      body: "شتاء موسكو لا يسامح معطفاً سيّئ الصنع. نأخذ هذا المعيار لأنفسنا: أقمشة ثقيلة، حياكة مقوّاة، إكسسوارات تتحمّل الشدّ. لا شيء في المجموعة موجود لأنه كان رخيص التنفيذ.",
    },
    {
      n: "٠٢",
      title: "عمارة لا طباعة",
      body: "قصّاتنا تأتي من المباني — ثِقَل الواجهات الستالينية، تكرار أقبية المترو، صفاء الزجاج البارد أمام الثلج. النِّسَب هي التي تتكلم، لذلك تبقى القطع هادئة.",
    },
    {
      n: "٠٣",
      title: "إصدارات محدودة",
      body: "كل إصدار بعدد ثابت من القطع. وعندما ينفد مقاس نُعلِمُه «نفد» بدل إخفائه، لأن من حقّك أن ترى بالضبط ما الذي احتواه الإصدار.",
    },
    {
      n: "٠٤",
      title: "مقاسات صادقة",
      body: "كل منتج ينشر جدول مقاساته الخاص، مأخوذاً من القطعة الحقيقية وهي مفرودة. و MOSCOW Fit AI يقرأ هذه الأرقام — لا جدولاً عاماً — ويخبرك بصراحة حين لا تكفيه البيانات.",
    },
  ],
};

export default async function AboutPage() {
  const locale = await getLocale();
  const t = (k: string) => translate(locale, k);

  const [settings, products] = await Promise.all([db().getSettings(), db().listProducts({})]);
  const pillars = PILLARS[locale] ?? PILLARS.en;

  const storyImage =
    settings.home_story_image ?? products[0]?.images[1]?.url ?? products[0]?.images[0]?.url ?? null;

  const aboutBody = (localized(settings, "about_body", locale) || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      <PageHeader
        eyebrow={t("home.introEyebrow")}
        title={t("page.about")}
        subtitle={localized(settings, "tagline", locale)}
        crumbs={[{ label: "MOSCOW", href: "/" }, { label: t("page.about") }]}
        tone="ice"
      />

      {/* opening statement */}
      <section className="mw-container py-14 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-20">
          <Reveal>
            <div>
              <p className="display-md">
                {locale === "ar"
                  ? "بُنيت موسكو على فكرة واحدة: أن تصمد القطعة أمام الطقس وأمام الزمن."
                  : "MOSCOW was built on one idea — that a garment should outlast both the weather and the season that sold it."}
              </p>
              <div className="mt-7 space-y-4">
                {(aboutBody.length
                  ? aboutBody
                  : locale === "ar"
                    ? [
                        "بدأنا من ملاحظة بسيطة: الستريت وير المحلي يستورد شكله من كاليفورنيا، بينما المدن التي تُلهمنا باردة وصارمة ورمادية. فأخذنا المرجع من مكان آخر — من واجهات موسكو، ومن أقبية مترو الأنفاق، ومن انعكاس الضوء على الجليد.",
                        "كل قطعة تبدأ برسم معماري قبل أن تصير باترون. نعمل مع مصانع محلية تعرف الدنيم الثقيل، ونرفض التنفيذ إذا جاءت العيّنة أخفّ أو أرخَص مما اتفقنا عليه.",
                        "النتيجة مجموعة صغيرة، تُنتج بأعداد محدودة، وتُصوَّر كما هي تماماً — بلا تعديل على اللون أو القصّة أو التفاصيل.",
                      ]
                    : [
                        "We started from a simple observation: local streetwear imports its look from California, while the cities that actually move us are cold, severe and grey. So we took the reference somewhere else — Moscow's facades, its metro vaults, the way light sits on ice.",
                        "Every piece begins as an architectural sketch before it becomes a pattern. We work with local factories that understand heavy denim, and we reject a run when the sample comes back lighter or cheaper than what we agreed.",
                        "The result is a small line, produced in limited numbers, and photographed exactly as it is — no retouching of colour, cut or detail.",
                      ]
                ).map((p, i) => (
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
          <h2 className="eyebrow">{locale === "ar" ? "ما نلتزم به" : "What we hold to"}</h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg bg-silver-200 sm:grid-cols-2">
            {pillars.map((p, i) => (
              <Reveal key={p.n} delay={(i % 2) * 0.07}>
                <div className="h-full bg-white p-7 sm:p-9">
                  <span className="font-display text-[13px] tabular-nums tracking-[0.2em] text-ice-400">
                    {p.n}
                  </span>
                  <h3 className="mt-4 font-display text-xl uppercase tracking-tight">{p.title}</h3>
                  <p className="mt-3 text-[14.5px] leading-[1.75] text-ice-700">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* closing */}
      <section className="mw-container py-16 text-center sm:py-24">
        <Reveal>
          <p className="eyebrow">{t("home.storyEyebrow")}</p>
          <p className="mx-auto mt-5 max-w-2xl display-md">
            {locale === "ar"
              ? "القطعة الجيدة لا تحتاج أن تصرخ."
              : "A good piece never has to raise its voice."}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn btn-primary">
              {t("common.shopNow")}
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              {t("nav.contact")}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
