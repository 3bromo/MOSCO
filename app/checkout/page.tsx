import type { Metadata } from "next";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import PageHeader from "@/components/ui/PageHeader";
import { currentCustomer } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "checkout.title"), robots: { index: false } };
}

export default async function CheckoutPage() {
  const locale = await getLocale();
  const [settings, customer] = await Promise.all([db().getSettings(), currentCustomer()]);

  const defaultAddress =
    customer?.addresses.find((a) => a.is_default) ?? customer?.addresses[0] ?? null;

  return (
    <>
      <PageHeader
        title={translate(locale, "checkout.title")}
        crumbs={[
          { label: "MOSCOW", href: "/" },
          { label: translate(locale, "cart.title"), href: "/cart" },
          { label: translate(locale, "checkout.title") },
        ]}
      />
      <CheckoutForm
        settings={{
          shipping_flat: settings.shipping_flat,
          free_shipping_threshold: settings.free_shipping_threshold,
          shipping_rates: settings.shipping_rates,
          instapay_handle: settings.instapay_handle,
          instapay_name: settings.instapay_name,
          instapay_instructions: settings.instapay_instructions,
          instapay_instructions_ar: settings.instapay_instructions_ar,
        }}
        customer={
          customer
            ? {
                full_name: customer.full_name,
                phone: customer.phone,
                email: customer.email,
                city: defaultAddress?.city ?? "",
                address: defaultAddress?.address ?? "",
              }
            : null
        }
      />
    </>
  );
}
