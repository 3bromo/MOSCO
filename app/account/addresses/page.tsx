import AddressBook from "@/components/account/AddressBook";
import { requireCustomer } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function AccountAddresses() {
  const customer = await requireCustomer();
  const locale = await getLocale();
  const settings = await db().getSettings();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl uppercase tracking-tight">
        {translate(locale, "account.addresses")}
      </h1>
      <AddressBook
        initial={customer.addresses}
        cities={settings.shipping_rates.map((r) => ({ city: r.city, city_ar: r.city_ar }))}
      />
    </div>
  );
}
