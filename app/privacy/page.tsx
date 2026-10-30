import type { Metadata } from "next";
import LegalPage from "@/components/content/LegalPage";
import { PRIVACY, pick } from "@/lib/content/pages";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "page.privacy"),
    description:
      locale === "ar"
        ? "ما نجمعه من بيانات، ولماذا، وكيف نحميه."
        : "What data we collect, why we collect it, and how it is protected.",
    alternates: { canonical: "/privacy" },
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  return (
    <LegalPage
      title={translate(locale, "page.privacy")}
      updated={locale === "ar" ? "آخر تحديث: أكتوبر ٢٠٢٦" : "Last updated: October 2026"}
      blocks={pick(PRIVACY, locale)}
      crumbs={[{ label: "MOSCOW", href: "/" }, { label: translate(locale, "page.privacy") }]}
    />
  );
}
