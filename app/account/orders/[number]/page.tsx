import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import OrderStatusBadge from "@/components/account/OrderStatusBadge";
import OrderTimeline from "@/components/order/OrderTimeline";
import { requireCustomer } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { localized } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetail({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const customer = await requireCustomer();
  const locale = await getLocale();
  const t = (k: string) => translate(locale, k);

  const order = await db().getOrderByNumber(decodeURIComponent(number));
  // Only the owner may read it — an order number alone is never enough here.
  if (!order || order.customer_id !== customer.id) notFound();

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-[13px] text-ice-600 hover:text-ice-900"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.75} />
        {t("account.orders")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="font-display text-2xl uppercase tracking-tight" dir="ltr">
          {order.order_number}
        </h1>
        <OrderStatusBadge status={order.status} label={t(`status.${order.status}`)} />
      </div>
      <p className="mt-1.5 text-[13px] text-ice-500">
        {t("track.placedOn")}{" "}
        {new Date(order.created_at).toLocaleDateString("en" ? "en-GB" : "en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <section className="rounded-lg border border-silver-200 bg-white p-6">
            <h2 className="eyebrow">{t("track.items")}</h2>
            <ul className="mt-4 divide-y divide-silver-200">
              {order.items.map((it, i) => (
                <li key={`${it.product_id}-${it.size}-${i}`} className="flex gap-4 py-4 first:pt-0">
                  <Link
                    href={`/product/${it.slug}`}
                    className="relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded bg-ice-100"
                  >
                    {it.image && (
                      <Image
                        src={it.image}
                        alt={localized(it, "name", locale)}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${it.slug}`} className="text-[14px] hover:underline">
                      {localized(it, "name", locale)}
                    </Link>
                    <p className="mt-1 text-[12.5px] text-ice-500">
                      {t("product.size")} {it.size} · ×{it.qty}
                    </p>
                  </div>
                  <span className="text-[14px] tabular-nums">
                    {formatMoney(it.unit_price * it.qty, locale)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2.5 border-t border-silver-200 pt-5 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-ice-600">{t("cart.subtotal")}</dt>
                <dd className="tabular-nums">{formatMoney(order.subtotal, locale)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>{t("cart.discount")}</dt>
                  <dd className="tabular-nums">− {formatMoney(order.discount, locale)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ice-600">{t("cart.shipping")}</dt>
                <dd className="tabular-nums">
                  {order.shipping === 0
                    ? t("cart.freeShipping")
                    : formatMoney(order.shipping, locale)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-silver-200 pt-3.5">
                <dt className="font-medium">{t("cart.total")}</dt>
                <dd className="font-display text-xl tabular-nums">
                  {formatMoney(order.total, locale)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-silver-200 bg-white p-6">
            <h2 className="eyebrow">{t("track.timeline")}</h2>
            <OrderTimeline order={order} locale={locale} />
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-silver-200 bg-white p-5">
            <h3 className="eyebrow">{t("track.deliverTo")}</h3>
            <address className="mt-3 space-y-1 text-[13.5px] not-italic leading-relaxed text-ice-700">
              <p className="font-medium text-ice-900">{order.full_name}</p>
              <p dir="ltr">{order.phone}</p>
              <p>{order.address}</p>
              <p>{order.city}</p>
            </address>
          </div>
          <div className="rounded-lg border border-silver-200 bg-white p-5">
            <h3 className="eyebrow">{t("track.paymentMethod")}</h3>
            <p className="mt-3 text-[13.5px] text-ice-800">
              {order.payment_method === "cod" ? t("checkout.cod") : t("checkout.instapay")}
            </p>
          </div>
          {order.notes && (
            <div className="rounded-lg border border-silver-200 bg-white p-5">
              <h3 className="eyebrow">{t("checkout.notes")}</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ice-700">{order.notes}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
