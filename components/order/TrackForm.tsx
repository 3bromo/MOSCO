"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, PackageSearch, Search } from "lucide-react";
import OrderStatusBadge from "@/components/account/OrderStatusBadge";
import type { Order, OrderStatus, TimelineEntry } from "@/lib/db/types";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useTrackTimeline } from "./TrackTimeline";

interface TrackedOrder {
  order_number: string;
  status: OrderStatus;
  created_at: string;
  timeline: TimelineEntry[];
  items: {
    name: string;
    name_ar?: string;
    slug: string;
    image: string;
    size: string;
    qty: number;
    unit_price: number;
  }[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment_method: Order["payment_method"];
  city: string;
  full_name: string;
}

export default function TrackForm({ initialOrder }: { initialOrder: string }) {
  const { t, locale } = useI18n();

  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ order?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setOrderNumber(initialOrder);
  }, [initialOrder]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!orderNumber.trim()) next.order = t("checkout.errEmpty");
    if (phone.replace(/\D/g, "").length < 8) next.phone = t("checkout.errPhone");
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setNotFound(false);
    setResult(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_number: orderNumber, phone }),
      });
      const data = await res.json();
      if (data.found) setResult(data.order);
      else setNotFound(true);
    } catch {
      setNotFound(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <form
        onSubmit={submit}
        noValidate
        className="rounded-lg border border-silver-200 bg-white p-6 sm:p-7"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="track_order">
              {t("track.orderNumber")}
            </label>
            <input
              id="track_order"
              value={orderNumber}
              dir="ltr"
              placeholder={t("track.orderNumberPh")}
              onChange={(e) => {
                setOrderNumber(e.target.value.toUpperCase());
                setErrors((s) => ({ ...s, order: undefined }));
              }}
              aria-invalid={Boolean(errors.order)}
              className={cn("field font-mono", errors.order && "is-invalid")}
            />
            {errors.order && <span className="err">{errors.order}</span>}
          </div>

          <div>
            <label className="label" htmlFor="track_phone">
              {t("track.phone")}
            </label>
            <input
              id="track_phone"
              value={phone}
              dir="ltr"
              inputMode="tel"
              placeholder="01X XXXX XXXX"
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((s) => ({ ...s, phone: undefined }));
              }}
              aria-invalid={Boolean(errors.phone)}
              className={cn("field", errors.phone && "is-invalid")}
            />
            {errors.phone && <span className="err">{errors.phone}</span>}
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn btn-primary mt-5 w-full sm:w-auto">
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Search className="h-4 w-4" strokeWidth={1.75} />
          )}
          {t("track.cta")}
        </button>
      </form>

      {notFound && (
        <div className="mt-6 flex items-start gap-3 rounded-lg bg-red-50 p-5">
          <PackageSearch className="mt-0.5 h-5 w-5 shrink-0 text-red-600" strokeWidth={1.5} />
          <p className="text-[13.5px] leading-relaxed text-red-700">{t("track.notFound")}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 animate-fade-up space-y-6">
          <div className="rounded-lg border border-silver-200 bg-white p-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <h2 className="font-display text-xl uppercase tracking-tight" dir="ltr">
                {result.order_number}
              </h2>
              <OrderStatusBadge status={result.status} label={t(`status.${result.status}`)} />
              <span className="ms-auto text-[13px] text-ice-500">
                {t("track.placedOn")}{" "}
                {new Date(result.created_at).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "long", year: "numeric" },
                )}
              </span>
            </div>

            <dl className="mt-5 grid gap-4 border-t border-silver-200 pt-5 sm:grid-cols-3">
              <div>
                <dt className="eyebrow">{t("track.deliverTo")}</dt>
                <dd className="mt-1.5 text-[13.5px] text-ice-800">
                  {result.full_name}
                  <span className="block text-ice-500">{result.city}</span>
                </dd>
              </div>
              <div>
                <dt className="eyebrow">{t("track.paymentMethod")}</dt>
                <dd className="mt-1.5 text-[13.5px] text-ice-800">
                  {result.payment_method === "cod" ? t("checkout.cod") : t("checkout.instapay")}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">{t("cart.total")}</dt>
                <dd className="mt-1.5 font-display text-lg tabular-nums">
                  {formatMoney(result.total, locale)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-silver-200 bg-white p-6">
            <h3 className="eyebrow">{t("track.status")}</h3>
            <TrackTimeline status={result.status} timeline={result.timeline} />
          </div>

          <div className="rounded-lg border border-silver-200 bg-white p-6">
            <h3 className="eyebrow">{t("track.items")}</h3>
            <ul className="mt-4 divide-y divide-silver-200">
              {result.items.map((it, i) => (
                <li key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <Link
                    href={`/product/${it.slug}`}
                    className="relative aspect-3/4 w-14 shrink-0 overflow-hidden rounded bg-ice-100"
                  >
                    {it.image && (
                      <Image
                        src={it.image}
                        alt={localized(it, "name", locale)}
                        fill
                        sizes="56px"
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
          </div>
        </div>
      )}
    </div>
  );
}
