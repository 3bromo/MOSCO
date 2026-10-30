import type { Metadata } from "next";
import LegalPage from "@/components/content/LegalPage";
import { SHIPPING } from "@/lib/content/pages";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const generateMetadata = async () => {
  const locale = await getLocale();
  return {
    title: translate(locale, "page.shipping"),
    description:
      locale === "ar"
        ? "كل ما تحتاج معرفته قبل أن يصل طردك."
        : "Everything that happens between checkout and your door.",
    alternates: { canonical: "/shipping" },
  };
};

export default async function ShippingPage() {
  const locale = await getLocale();
  const t = (k: string) => translate(locale, k);
  return (
    <LegalPage
      eyebrow="MOSCOW"
      title={translate(locale, "page.shipping")}
      subtitle={t("shipping.subtitle")}
      blocks={SHIPPING}
      crumbs={[
        { label: "MOSCOW", href: "/" },
        { label: translate(locale, "page.shipping") },
      ]}
    />
  );
}
