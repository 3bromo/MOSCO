import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package, Wallet } from "lucide-react";
import OrderStatusBadge from "@/components/account/OrderStatusBadge";
import { requireCustomer } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AccountOverview() {
  const customer = await requireCustomer();
  const locale = await getLocale();
  const t = (k: string, v?: Record<string, string | number>) => translate(locale, k, v);

  const orders = await db().listOrders({ customerId: customer.id });
  const spent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((n, o) => n + o.total, 0);
  const recent = orders.slice(0, 3);

  const stats = [
    { icon: Package, label: t("account.orderCount"), value: String(orders.length) },
    { icon: Wallet, label: t("account.totalSpent"), value: formatMoney(spent, locale) },
    { icon: Heart, label: t("account.wishlist"), value: String(customer.wishlist.length) },
    { icon: MapPin, label: t("account.addresses"), value: String(customer.addresses.length) },
  ];

  return (
    <div className="space-y-10">
      <section>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-silver-200 bg-white p-5">
              <s.icon className="h-4.5 w-4.5 text-ice-500" strokeWidth={1.5} />
              <dd className="mt-3 font-display text-2xl tabular-nums leading-none">{s.value}</dd>
              <dt className="mt-1.5 text-[12px] text-ice-600">{s.label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[12.5px] text-ice-500">
          {t("account.memberSince")}{" "}
          {new Date(customer.created_at).toLocaleDateString("en" ? "en-GB" : "en-GB", {
            year: "numeric",
            month: "long",
          })}
        </p>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl uppercase tracking-tight">{t("account.orders")}</h2>
          {orders.length > 0 && (
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1.5 text-[13px] text-ice-700 underline underline-offset-4 hover:text-ice-900"
            >
              {t("common.viewAll")}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.75} />
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-silver-300 p-10 text-center">
            <Package className="mx-auto h-7 w-7 text-ice-400" strokeWidth={1.25} />
            <p className="mt-3 text-[14px] text-ice-600">{t("account.noOrders")}</p>
            <Link href="/shop" className="btn btn-primary mt-5">
              {t("common.shopNow")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {recent.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.order_number}`}
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-silver-200 bg-white p-5 transition-colors hover:border-ice-400"
                >
                  <span className="font-mono text-[13.5px] font-medium" dir="ltr">
                    {o.order_number}
                  </span>
                  <OrderStatusBadge status={o.status} label={t(`status.${o.status}`)} />
                  <span className="text-[13px] text-ice-500">
                    {new Date(o.created_at).toLocaleDateString(
                      "en" ? "en-GB" : "en-GB",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </span>
                  <span className="ms-auto font-medium tabular-nums">
                    {formatMoney(o.total, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
