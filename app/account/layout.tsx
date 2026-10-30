import AccountNav from "@/components/account/AccountNav";
import PageHeader from "@/components/ui/PageHeader";
import { currentCustomer } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const customer = await currentCustomer();
  const locale = await getLocale();

  // Login / register render standalone — they live under /account but have no shell.
  if (!customer) return <>{children}</>;

  return (
    <>
      <PageHeader
        eyebrow={translate(locale, "account.hello", { name: customer.full_name.split(" ")[0] })}
        title={translate(locale, "account.title")}
        crumbs={[
          { label: "MOSCOW", href: "/" },
          { label: translate(locale, "account.title") },
        ]}
      />
      <div className="mw-container grid gap-8 py-10 lg:grid-cols-[220px_1fr] lg:gap-14 lg:py-14">
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
