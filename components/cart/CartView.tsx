"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";
import type { ShippingRate } from "@/lib/db/types";
import { formatMoney } from "@/lib/money";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { useCart } from "@/lib/store/cart";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

interface ServerLine {
  product_id: string;
  slug: string;
  name: string;
  name_ar?: string;
  image: string;
  size: string;
  qty: number;
  unit_price: number;
  max: number;
  sizes: { size: string; stock: number }[];
}

export default function CartView({
  shippingFlat,
  freeShippingThreshold,
}: {
  shippingFlat: number;
  freeShippingThreshold: number;
  shippingRates?: ShippingRate[];
}) {
  const { t, locale } = useI18n();
  const lines = useCart((s) => s.lines);
  const hydrated = useCart((s) => s.hydrated);
  const setQty = useCart((s) => s.setQty);
  const setSize = useCart((s) => s.setSize);
  const remove = useCart((s) => s.remove);
  const toast = useUI((s) => s.toast);

  const [server, setServer] = useState<ServerLine[] | null>(null);
  const [promo, setPromo] = useState("");
  const [promoState, setPromoState] = useState<{
    code: string;
    amount: number;
    freeShipping: boolean;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  /* --- re-validate against the database whenever the cart changes --- */
  useEffect(() => {
    if (!hydrated) return;
    if (lines.length === 0) {
      setServer([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            items: lines.map((l) => ({ product_id: l.product_id, size: l.size, qty: l.qty })),
          }),
        });
        const data = (await res.json()) as { lines: ServerLine[] };
        if (!cancelled) setServer(data.lines ?? []);
      } catch {
        if (!cancelled) setServer([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lines, hydrated]);

  const subtotal = useMemo(
    () => lines.reduce((n, l) => n + l.qty * l.unit_price, 0),
    [lines],
  );

  const shipping = promoState?.freeShipping
    ? 0
    : subtotal >= freeShippingThreshold && subtotal > 0
      ? 0
      : subtotal > 0
        ? shippingFlat
        : 0;

  const discount = promoState?.amount ?? 0;
  const total = Math.max(0, subtotal - discount + shipping);
  const remaining = Math.max(0, freeShippingThreshold - subtotal);

  const applyPromo = useCallback(async () => {
    if (!promo.trim()) return;
    setChecking(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/discount", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: promo, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoState({ code: data.code, amount: data.amount, freeShipping: data.freeShipping });
        toast(t("cart.promoApplied", { code: data.code }), "success");
        try {
          sessionStorage.setItem("mosco.promo", data.code);
        } catch {
          /* private mode */
        }
      } else {
        setPromoState(null);
        setPromoError(t("cart.promoInvalid"));
      }
    } catch {
      setPromoError(t("cart.promoInvalid"));
    } finally {
      setChecking(false);
    }
  }, [promo, subtotal, t, toast]);

  if (!hydrated) {
    return (
      <div className="mw-container py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-5">
                <div className="skeleton aspect-3/4 w-28 rounded-lg" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-3 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mw-container flex flex-col items-center justify-center py-24 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-ice-100">
          <ShoppingBag className="h-7 w-7 text-ice-600" strokeWidth={1.25} />
        </div>
        <h2 className="mt-6 font-display text-2xl uppercase tracking-tight">{t("cart.empty")}</h2>
        <p className="mt-2 text-[15px] text-ice-600">{t("cart.emptyHint")}</p>
        <Link href="/shop" className="btn btn-primary mt-7">
          {t("cart.continue")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mw-container py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
        {/* ------------- lines ------------- */}
        <section>
          {freeShippingThreshold > 0 && (
            <div className="mb-7 rounded-lg bg-ice-50 p-4">
              <p className="text-[13px] text-ice-700">
                {remaining > 0
                  ? t("cart.freeShippingProgress", { amount: formatMoney(remaining, locale) })
                  : t("cart.freeShippingUnlocked")}
              </p>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ice-200">
                <div
                  className="h-full rounded-full bg-ice-800 transition-[width] duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, (subtotal / Math.max(1, freeShippingThreshold)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <ul className="divide-y divide-silver-200 border-y border-silver-200">
            {lines.map((l) => {
              const sv = server?.find((s) => s.product_id === l.product_id && s.size === l.size);
              const availableSizes = sv?.sizes ?? [];
              const outOfStock = sv ? sv.max <= 0 : false;

              return (
                <li key={l.key} className="flex gap-4 py-6 sm:gap-6">
                  <Link
                    href={`/product/${l.slug}`}
                    className="relative aspect-3/4 w-24 shrink-0 overflow-hidden rounded-lg bg-ice-100 sm:w-32"
                  >
                    <Image
                      src={l.image}
                      alt={localized(l, "name", locale)}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-medium leading-snug">
                          <Link href={`/product/${l.slug}`} className="hover:underline">
                            {localized(l, "name", locale)}
                          </Link>
                        </h3>
                        {l.color && <p className="mt-1 text-[13px] text-ice-600">{l.color}</p>}
                        {outOfStock && (
                          <p className="mt-1.5 text-[12.5px] font-medium text-red-600">
                            {t("product.outOfStock")}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(l.key)}
                        className="-mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ice-500 transition-colors hover:bg-ice-100 hover:text-ice-900"
                        aria-label={`${t("common.remove")} ${l.name}`}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {/* size swap — straight from live stock */}
                      <label className="sr-only" htmlFor={`size-${l.key}`}>
                        {t("cart.changeSize")}
                      </label>
                      <select
                        id={`size-${l.key}`}
                        value={l.size}
                        onChange={(e) => {
                          const next = e.target.value;
                          const max =
                            availableSizes.find((s) => s.size === next)?.stock ?? l.max;
                          setSize(l.key, next, max);
                        }}
                        className="h-10 cursor-pointer rounded-md border border-silver-300 bg-white px-3 text-[13px] outline-none transition-colors hover:border-ice-500 focus:border-ice-500"
                      >
                        {(availableSizes.length
                          ? availableSizes
                          : [{ size: l.size, stock: l.max }]
                        ).map((s) => (
                          <option key={s.size} value={s.size} disabled={s.stock <= 0}>
                            {t("product.size")} {s.size}
                            {s.stock <= 0 ? ` — ${t("common.soldOut")}` : ""}
                          </option>
                        ))}
                      </select>

                      <div className="inline-flex items-center rounded-full border border-silver-300">
                        <button
                          type="button"
                          onClick={() => setQty(l.key, l.qty - 1)}
                          className="grid h-10 w-10 place-items-center rounded-full text-ice-700 hover:bg-ice-100"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <span className="w-8 text-center text-[14px] tabular-nums">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const { capped } = setQty(l.key, l.qty + 1);
                            if (capped) toast(t("cart.stockWarn", { n: l.max }), "info");
                          }}
                          disabled={l.qty >= (sv?.max ?? l.max)}
                          className="grid h-10 w-10 place-items-center rounded-full text-ice-700 hover:bg-ice-100 disabled:opacity-35"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>

                      <span className="ms-auto text-[15px] font-medium tabular-nums">
                        {formatMoney(l.unit_price * l.qty, locale)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Link
            href="/shop"
            className="mt-7 inline-flex items-center gap-2 text-[13px] text-ice-700 underline underline-offset-4 hover:text-ice-900"
          >
            {t("cart.continue")}
          </Link>
        </section>

        {/* ------------- summary ------------- */}
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <div className="rounded-lg border border-silver-200 bg-white p-6">
            <h2 className="font-display text-lg uppercase tracking-tight">
              {t("checkout.summary")}
            </h2>

            {/* promo */}
            <div className="mt-5">
              <label className="label" htmlFor="promo">
                {t("cart.promo")}
              </label>
              <div className="flex gap-2">
                <input
                  id="promo"
                  value={promo}
                  onChange={(e) => {
                    setPromo(e.target.value.toUpperCase());
                    setPromoError(null);
                  }}
                  placeholder={t("cart.promoPlaceholder")}
                  className={cn("field", promoError && "is-invalid")}
                  style={{ fontSize: 16 }}
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={checking || !promo.trim()}
                  className="btn btn-ghost shrink-0 !px-5"
                >
                  {t("common.apply")}
                </button>
              </div>
              {promoError && <span className="err">{promoError}</span>}
              {promoState && (
                <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-emerald-700">
                  <Tag className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {t("cart.promoApplied", { code: promoState.code })}
                </p>
              )}
            </div>

            <dl className="mt-6 space-y-3 border-t border-silver-200 pt-5 text-[14px]">
              <Row label={t("cart.subtotal")} value={formatMoney(subtotal, locale)} />
              {discount > 0 && (
                <Row
                  label={t("cart.discount")}
                  value={`− ${formatMoney(discount, locale)}`}
                  tone="positive"
                />
              )}
              <Row
                label={t("cart.shipping")}
                value={shipping === 0 ? t("cart.freeShipping") : formatMoney(shipping, locale)}
                hint={t("cart.calculatedAtCheckout")}
              />
              <div className="flex items-baseline justify-between border-t border-silver-200 pt-4">
                <dt className="text-[15px] font-medium">{t("cart.total")}</dt>
                <dd className="font-display text-2xl tabular-nums">
                  {formatMoney(total, locale)}
                </dd>
              </div>
            </dl>

            <Link href="/checkout" className="btn btn-primary mt-6 w-full !py-4">
              {t("cart.checkout")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.75} />
            </Link>

            <p className="mt-4 text-center text-[11.5px] uppercase tracking-[0.1em] text-ice-500">
              {t("footer.payments")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "positive";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ice-600">
        {label}
        {hint && <span className="block text-[11.5px] text-ice-400">{hint}</span>}
      </dt>
      <dd className={cn("tabular-nums", tone === "positive" ? "text-emerald-700" : "text-ice-900")}>
        {value}
      </dd>
    </div>
  );
}
