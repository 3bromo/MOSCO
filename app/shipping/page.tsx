import type { Metadata } from "next";
import LegalPage from "@/components/content/LegalPage";
import { SHIPPING, pick } from "@/lib/content/pages";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "page.shipping"),
    description:
      locale === "ar"
        ? "مواعيد التجهيز ومدة التوصيل وتكلفة الشحن حسب المحافظة وتتبّع الطلب."
        : "Dispatch times, delivery windows, shipping cost by governorate and order tracking.",
    alternates: { canonical: "/shipping" },
  };
}

export default async function ShippingPage() {
  const locale = await getLocale();
  return (
    <LegalPage
      eyebrow="MOSCOW"
      title={translate(locale, "page.shipping")}
      subtitle={
        locale === "ar"
          ? "كل ما تحتاج معرفته قبل أن يصل طردك."
          : "Everything that happens between checkout and your door."
      }
      blocks={pick(SHIPPING, locale)}
      crumbs={[{ label: "MOSCOW", href: "/" }, { label: translate(locale, "page.shipping") }]}
    />
  );
}
