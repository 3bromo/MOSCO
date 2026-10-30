"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { useCart } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

export default function CartDrawer({
  freeShippingThreshold,
}: {
  freeShippingThreshold: number;
}) {
  const { t, locale } = useI18n();
  const open = useCart((s) => s.open);
  const setOpen = useCart((s) => s.setOpen);
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  const subtotal = lines.reduce((n, l) => n + l.qty * l.unit_price, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progress = freeShippingThreshold
    ? Math.min(100, (subtotal / freeShippingThreshold) * 100)
    : 100;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-ice-950/35 backdrop-blur-sm transition-opacity duration-400",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
          open ? "translate-x-0" : "translate-x-full rtl:-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.title")}
      >
        <header className="flex items-center justify-between border-b border-silver-200 px-5 py-4">
          <h2 className="font-display text-lg uppercase tracking-tight">
            {t("cart.title")}
            {count > 0 && <span className="ms-2 text-sm text-ice-600">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-ice-100"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>

        {freeShippingThreshold > 0 && lines.length > 0 && (
          <div className="border-b border-silver-200 bg-ice-50 px-5 py-3">
            <p className="text-[12px] text-ice-700">
              {remaining > 0
                ? t("cart.freeShippingProgress", { amount: formatMoney(remaining, locale) })
                : t("cart.freeShippingUnlocked")}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-ice-200">
              <div
                className="h-full rounded-full bg-ice-700 transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-ice-100">
              <ShoppingBag className="h-6 w-6 text-ice-600" strokeWidth={1.25} />
            </div>
            <div>
              <p className="font-display text-lg uppercase tracking-tight">{t("cart.empty")}</p>
              <p className="mt-1 text-sm text-ice-600">{t("cart.emptyHint")}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ice mt-2">
              {t("cart.continue")}
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-silver-200 overflow-y-auto overscroll-contain px-5">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-4 py-5">
                  <Link
                    href={`/product/${l.slug}`}
                    onClick={() => setOpen(false)}
                    className="relative aspect-3/4 w-20 shrink-0 overflow-hidden rounded-md bg-ice-100"
                  >
                    <Image
                      src={l.image}
                      alt={localized(l, "name", locale)}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${l.slug}`}
                        onClick={() => setOpen(false)}
                        className="text-[14px] leading-snug font-medium hover:underline"
                      >
                        {localized(l, "name", locale)}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(l.key)}
                        className="-mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ice-500 hover:bg-ice-100 hover:text-ice-900"
                        aria-label={`${t("common.remove")} ${l.name}`}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>

                    <p className="mt-1 text-[12px] text-ice-600">
                      {t("product.size")} {l.size}
                      {l.color ? ` · ${l.color}` : ""}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border border-silver-300">
                        <button
                          type="button"
                          onClick={() => setQty(l.key, l.qty - 1)}
                          className="grid h-8 w-8 place-items-center rounded-full text-ice-700 hover:bg-ice-100"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <span className="w-7 text-center text-[13px] tabular-nums">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(l.key, l.qty + 1)}
                          disabled={l.qty >= l.max}
                          className="grid h-8 w-8 place-items-center rounded-full text-ice-700 hover:bg-ice-100 disabled:opacity-35"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>
                      <span className="text-[14px] font-medium tabular-nums">
                        {formatMoney(l.unit_price * l.qty, locale)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-silver-200 bg-white px-5 py-5">
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-ice-700">{t("cart.subtotal")}</span>
                <span className="font-display text-lg tabular-nums">
                  {formatMoney(subtotal, locale)}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-ice-500">{t("cart.calculatedAtCheckout")}</p>

              <div className="mt-4 grid gap-2">
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary w-full"
                >
                  {t("cart.checkout")}
                </Link>
                <Link href="/cart" onClick={() => setOpen(false)} className="btn btn-ghost w-full">
                  {t("cart.title")}
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
