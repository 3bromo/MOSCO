import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Package, Smartphone, Truck } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import { db } from "@/lib/db";
import { localized } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "checkout.success"), robots: { index: false } };
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const locale = await getLocale();
  const t = (k: string, v?: Record<string, string | number>) => translate(locale, k, v);

  const order = await db().getOrderByNumber(decodeURIComponent(number));
  if (!order) notFound();

  const steps = [
    { icon: Check, label: t("checkout.next1") },
    {
      icon: order.payment_method === "instapay" ? Smartphone : Package,
      label: t("checkout.next2"),
    },
    { icon: Truck, label: t("checkout.next3") },
  ];

  return (
    <div className="mw-container py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
              <Check className="h-7 w-7 text-emerald-600" strokeWidth={1.5} />
            </span>
            <h1 className="mt-6 font-display text-3xl uppercase tracking-tight sm:text-4xl">
              {t("checkout.success")}
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ice-600">
              {t("checkout.successSub")}
            </p>

            <div className="mt-7 rounded-lg bg-ice-50 px-7 py-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-ice-500">
                {t("checkout.orderNumber")}
              </p>
              <p className="mt-1 font-mono text-xl font-medium tracking-wide" dir="ltr">
                {order.order_number}
              </p>
            </div>
          </div>
        </Reveal>

        {/* what happens next */}
        <Reveal delay={0.08}>
          <div className="mt-12">
            <h2 className="eyebrow text-center">{t("checkout.whatNext")}</h2>
            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-silver-200 bg-white p-5 text-center"
                >
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-ice-100 text-ice-800">
                    <s.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                  </span>
                  <p className="mt-3 text-[13px] leading-snug text-ice-700">{s.label}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        {/* order recap */}
        <Reveal delay={0.14}>
          <div className="mt-10 rounded-lg border border-silver-200 bg-white p-6">
            <ul className="divide-y divide-silver-200">
              {order.items.map((it, i) => (
                <li key={`${it.product_id}-${it.size}-${i}`} className="flex gap-4 py-4 first:pt-0">
                  <div className="relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded bg-ice-100">
                    {it.image && (
                      <Image
                        src={it.image}
                        alt={localized(it, "name", locale)}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-snug">{localized(it, "name", locale)}</p>
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
                  <dt>
                    {t("cart.discount")}
                    {order.discount_code ? ` · ${order.discount_code}` : ""}
                  </dt>
                  <dd className="tabular-nums">− {formatMoney(order.discount, locale)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ice-600">{t("cart.shipping")}</dt>
                <dd className="tabular-nums">
                  {order.shipping === 0 ? t("cart.freeShipping") : formatMoney(order.shipping, locale)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-silver-200 pt-4">
                <dt className="text-[15px] font-medium">{t("cart.total")}</dt>
                <dd className="font-display text-xl tabular-nums">
                  {formatMoney(order.total, locale)}
                </dd>
              </div>
              <div className="flex justify-between pt-1">
                <dt className="text-ice-600">{t("track.paymentMethod")}</dt>
                <dd>
                  {order.payment_method === "cod" ? t("checkout.cod") : t("checkout.instapay")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ice-600">{t("track.deliverTo")}</dt>
                <dd className="max-w-[60%] text-end text-ice-800">
                  {order.full_name} · {order.city}
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/track?order=${encodeURIComponent(order.order_number)}`}
            className="btn btn-primary"
          >
            {t("checkout.trackCta")}
          </Link>
          <Link href="/shop" className="btn btn-ghost">
            {t("cart.continue")}
          </Link>
        </div>
      </div>
    </div>
  );
}
