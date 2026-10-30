import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import FaqAccordion from "@/components/content/FaqAccordion";
import PageHeader from "@/components/ui/PageHeader";
import { FAQ, pick } from "@/lib/content/pages";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "page.faq"),
    description:
      locale === "ar"
        ? "إجابات عن المقاسات والدفع والشحن والإرجاع والعناية بالدنيم."
        : "Answers on sizing, payment, delivery, returns and caring for denim.",
    alternates: { canonical: "/faq" },
  };
}

export default async function FaqPage() {
  const locale = await getLocale();
  const items = pick(FAQ, locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        eyebrow="MOSCOW"
        title={translate(locale, "page.faq")}
        subtitle={
          locale === "ar"
            ? "الأسئلة التي تصلنا أكثر من غيرها."
            : "The questions we get asked most."
        }
        crumbs={[{ label: "MOSCOW", href: "/" }, { label: translate(locale, "page.faq") }]}
        tone="ice"
      />

      <div className="mw-container py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <FaqAccordion items={items} />

          <div className="mt-12 rounded-lg bg-ice-50 p-7 text-center sm:p-9">
            <h2 className="font-display text-xl uppercase tracking-tight">
              {locale === "ar" ? "لم تجد إجابتك؟" : "Still need an answer?"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ice-700">
              {locale === "ar"
                ? "راسلنا وسنردّ عليك عادةً في نفس يوم العمل."
                : "Write to us — we normally reply the same working day."}
            </p>
            <Link href="/contact" className="btn btn-primary mt-6">
              {translate(locale, "nav.contact")}
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
