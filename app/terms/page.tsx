import type { Metadata } from "next";
import LegalPage from "@/components/content/LegalPage";
import { TERMS, pick } from "@/lib/content/pages";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "page.terms"),
    description:
      locale === "ar"
        ? "شروط وأحكام الشراء من موسكو."
        : "The terms that apply when you buy from MOSCOW.",
    alternates: { canonical: "/terms" },
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  return (
    <LegalPage
      title={translate(locale, "page.terms")}
      updated={locale === "ar" ? "آخر تحديث: أكتوبر ٢٠٢٦" : "Last updated: October 2026"}
      blocks={pick(TERMS, locale)}
      crumbs={[{ label: "MOSCOW", href: "/" }, { label: translate(locale, "page.terms") }]}
    />
  );
}
