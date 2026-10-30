import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";
import PageHeader from "@/components/ui/PageHeader";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "cart.title"), robots: { index: false } };
}

export default async function CartPage() {
  const locale = await getLocale();
  const settings = await db().getSettings();

  return (
    <>
      <PageHeader
        title={translate(locale, "cart.title")}
        crumbs={[{ label: "MOSCOW", href: "/" }, { label: translate(locale, "cart.title") }]}
      />
      <CartView
        shippingFlat={settings.shipping_flat}
        freeShippingThreshold={settings.free_shipping_threshold}
        shippingRates={settings.shipping_rates}
      />
    </>
  );
}
