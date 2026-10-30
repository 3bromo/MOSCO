import type { Metadata } from "next";
import LegalPage from "@/components/content/LegalPage";
import { RETURNS, pick } from "@/lib/content/pages";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "page.returns"),
    description:
      locale === "ar"
        ? "سياسة الإرجاع والاستبدال في موسكو — ١٤ يوماً، واستبدال مقاس مجاني داخل مصر."
        : "MOSCOW returns and exchanges — 14 days, and one free size exchange per order in Egypt.",
    alternates: { canonical: "/returns" },
  };
}

export default async function ReturnsPage() {
  const locale = await getLocale();
  return (
    <LegalPage
      eyebrow="MOSCOW"
      title={translate(locale, "page.returns")}
      subtitle={
        locale === "ar"
          ? "إذا لم تكن القطعة كما تخيّلتها، أعدها."
          : "If the piece isn't what you pictured, send it back."
      }
      blocks={pick(RETURNS, locale)}
      crumbs={[{ label: "MOSCOW", href: "/" }, { label: translate(locale, "page.returns") }]}
    />
  );
}
