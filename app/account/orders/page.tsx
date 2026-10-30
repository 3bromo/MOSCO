import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import OrderStatusBadge from "@/components/account/OrderStatusBadge";
import { requireCustomer } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { localized } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AccountOrders() {
  const customer = await requireCustomer();
  const locale = await getLocale();
  const t = (k: string) => translate(locale, k);

  const orders = await db().listOrders({ customerId: customer.id });

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-silver-300 p-12 text-center">
        <Package className="mx-auto h-8 w-8 text-ice-400" strokeWidth={1.25} />
        <p className="mt-4 text-[15px] text-ice-600">{t("account.noOrders")}</p>
        <Link href="/shop" className="btn btn-primary mt-6">
          {t("common.shopNow")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl uppercase tracking-tight">{t("account.orders")}</h1>
      <ul className="space-y-4">
        {orders.map((o) => (
          <li key={o.id} className="rounded-lg border border-silver-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
              <span className="font-mono text-[14px] font-medium" dir="ltr">
                {o.order_number}
              </span>
              <OrderStatusBadge status={o.status} label={t(`status.${o.status}`)} />
              <span className="text-[13px] text-ice-500">
                {new Date(o.created_at).toLocaleDateString("en" ? "en-GB" : "en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="ms-auto font-medium tabular-nums">
                {formatMoney(o.total, locale)}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex -space-x-3 rtl:space-x-reverse">
                {o.items.slice(0, 4).map((it, i) => (
                  <div
                    key={`${it.product_id}-${it.size}-${i}`}
                    className="relative aspect-3/4 w-11 overflow-hidden rounded border-2 border-white bg-ice-100"
                  >
                    {it.image && (
                      <Image
                        src={it.image}
                        alt={localized(it, "name", locale)}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[13px] text-ice-600">
                {o.items.reduce((n, i) => n + i.qty, 0)}{" "}
                {o.items.reduce((n, i) => n + i.qty, 0) === 1 ? t("cart.item") : t("cart.items")}
              </span>
              <Link
                href={`/account/orders/${o.order_number}`}
                className="ms-auto inline-flex items-center gap-1.5 text-[13px] text-ice-800 underline underline-offset-4 hover:text-ice-950"
              >
                {t("account.viewOrder")}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.75} />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
