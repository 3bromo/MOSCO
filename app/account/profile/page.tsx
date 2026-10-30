import ProfileForm from "@/components/account/ProfileForm";
import { requireCustomer } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function AccountProfile() {
  const customer = await requireCustomer();
  const locale = await getLocale();

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl uppercase tracking-tight">
        {translate(locale, "account.profile")}
      </h1>
      <div className="rounded-lg border border-silver-200 bg-white p-6">
        <ProfileForm
          initial={{
            full_name: customer.full_name,
            phone: customer.phone,
            email: customer.email,
          }}
        />
      </div>
    </div>
  );
}
