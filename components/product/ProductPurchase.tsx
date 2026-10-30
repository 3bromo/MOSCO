"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronDown, Heart, Minus, Plus, Ruler, ShoppingBag } from "lucide-react";
import type { FitAiSettings, Product } from "@/lib/db/types";
import { stockForSize, totalStock } from "@/lib/db/types";
import { discountPercent, formatMoney } from "@/lib/money";
import { localized, localizedList } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { useCart } from "@/lib/store/cart";
import { useUI } from "@/lib/store/ui";
import { useWishlist } from "@/lib/store/wishlist";
import { cn } from "@/lib/utils";
import FitAi from "./FitAi";
import SizeChart from "./SizeChart";

export default function ProductPurchase({
  product,
  fitSettings,
  shippingNote,
}: {
  product: Product;
  fitSettings: FitAiSettings;
  shippingNote: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const setCartOpen = useCart((s) => s.setOpen);
  const toast = useUI((s) => s.toast);
  const toggleWish = useWishlist((s) => s.toggle);
  const saved = useWishlist((s) => s.ids.includes(product.id));
  const wishHydrated = useWishlist((s) => s.hydrated);

  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(product.colors[0]?.name ?? null);
  const [qty, setQty] = useState(1);
  const [chartOpen, setChartOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [adding, setAdding] = useState(false);

  const stock = totalStock(product);
  const soldOut = stock <= 0;
  const sizeStock = size ? stockForSize(product, size) : 0;
  const off = discountPercent(product.price, product.compare_at_price);
  const name = localized(product, "name", locale);
  const details = localizedList(product, "details", locale);

  function selectSize(s: string) {
    setSize(s);
    setSizeError(false);
    setQty(1);
  }

  function buildLine() {
    return {
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      name_ar: product.name_ar,
      image: product.images[0]?.url ?? "",
      size: size!,
      color,
      qty,
      unit_price: product.price,
      max: sizeStock,
    };
  }

  function handleAdd(then?: "cart" | "checkout") {
    if (!size) {
      setSizeError(true);
      toast(t("product.selectSizeFirst"), "error");
      document.getElementById("size-selector")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    setAdding(true);
    const { capped } = add(buildLine());
    if (capped) toast(t("cart.stockWarn", { n: sizeStock }), "info");
    else toast(t("product.added"), "success");

    window.setTimeout(() => {
      setAdding(false);
      if (then === "checkout") router.push("/checkout");
      else if (then === "cart") setCartOpen(true);
    }, 260);
  }

  return (
    <div className="flex flex-col gap-7">
      {/* ---------------- title + price ---------------- */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {product.badges.includes("new") && <Pill>{t("common.new")}</Pill>}
          {product.badges.includes("bestseller") && <Pill>{t("common.bestseller")}</Pill>}
          {off != null && <Pill tone="dark">−{off}%</Pill>}
        </div>

        <h1 className="mt-3 font-display text-3xl leading-[1.05] tracking-tight text-ice-900 uppercase sm:text-4xl">
          {name}
        </h1>
        {product.subtitle && (
          <p className="mt-2 text-[14px] text-ice-600">{localized(product, "subtitle", locale)}</p>
        )}

        <div className="mt-4 flex items-baseline gap-3">
          <span className="font-display text-2xl tabular-nums text-ice-900">
            {formatMoney(product.price, locale)}
          </span>
          {product.compare_at_price ? (
            <span className="text-[15px] tabular-nums text-ice-500 line-through">
              {formatMoney(product.compare_at_price, locale)}
            </span>
          ) : null}
        </div>

        <p className="mt-2.5 flex items-center gap-2 text-[13px]">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              soldOut ? "bg-red-500" : stock <= 5 ? "bg-amber-500" : "bg-emerald-500",
            )}
          />
          <span className={soldOut ? "text-red-600" : "text-ice-600"}>
            {soldOut
              ? t("product.outOfStock")
              : stock <= 5
                ? t("product.onlyLeft", { n: stock })
                : t("common.inStock")}
          </span>
        </p>
      </div>

      {/* ---------------- colour ---------------- */}
      {product.colors.length > 0 && (
        <div>
          <p className="label">
            {t("product.color")}
            {color && <span className="ms-2 font-normal normal-case tracking-normal text-ice-600">{color}</span>}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                aria-pressed={color === c.name}
                aria-label={c.name}
                title={c.name}
                className={cn(
                  "relative h-10 w-10 rounded-full ring-1 ring-black/10 transition-all duration-300",
                  color === c.name
                    ? "ring-2 ring-ice-900 ring-offset-2"
                    : "hover:ring-ice-500",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---------------- size ---------------- */}
      <div id="size-selector">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="label !mb-0">
            {t("product.size")}
            {size && (
              <span className="ms-2 font-normal normal-case tracking-normal text-ice-600">
                {size}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => setChartOpen(true)}
            className="inline-flex items-center gap-1.5 text-[12px] text-ice-700 underline underline-offset-4 hover:text-ice-900"
          >
            <Ruler className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t("product.sizeGuide")}
          </button>
        </div>

        <div
          className={cn(
            "grid grid-cols-4 gap-2 sm:grid-cols-5",
            sizeError && "rounded-lg ring-2 ring-red-400 ring-offset-4",
          )}
          role="group"
          aria-label={t("product.selectSize")}
        >
          {product.sizes.map((row) => {
            const out = row.stock <= 0;
            const on = size === row.size;
            return (
              <button
                key={row.size}
                type="button"
                onClick={() => !out && selectSize(row.size)}
                disabled={out}
                aria-pressed={on}
                className={cn(
                  "relative min-h-11 rounded-md border px-2 py-2.5 text-[13px] font-medium transition-all duration-250",
                  on
                    ? "border-ice-900 bg-ice-900 text-white"
                    : out
                      ? "cursor-not-allowed border-silver-200 bg-silver-100 text-silver-500"
                      : "border-silver-300 bg-white text-ice-900 hover:border-ice-900",
                )}
              >
                {row.size}
                {out && (
                  <span
                    className="pointer-events-none absolute inset-0 grid place-items-center"
                    aria-hidden="true"
                  >
                    <span className="h-px w-[78%] rotate-[-18deg] bg-silver-500" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {sizeError && <span className="err mt-2">{t("product.selectSizeFirst")}</span>}
        {size && sizeStock > 0 && sizeStock <= 3 && (
          <p className="mt-2 text-[12.5px] text-amber-700">
            {t("product.onlyLeft", { n: sizeStock })}
          </p>
        )}
      </div>

      {/* ---------------- fit ai ---------------- */}
      <FitAi
        product={product}
        settings={fitSettings}
        selectedSize={size}
        onSelectSize={selectSize}
        onOpenChart={() => setChartOpen(true)}
      />

      {/* ---------------- quantity + actions ---------------- */}
      <div className="flex flex-col gap-3">
        <div className="flex items-stretch gap-3">
          <div className="flex items-center rounded-full border border-silver-300 bg-white">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="grid h-12 w-12 place-items-center rounded-full text-ice-700 hover:bg-ice-100 disabled:opacity-35"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="w-8 text-center text-[15px] tabular-nums" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(size ? sizeStock : 10, q + 1))}
              disabled={Boolean(size) && qty >= sizeStock}
              className="grid h-12 w-12 place-items-center rounded-full text-ice-700 hover:bg-ice-100 disabled:opacity-35"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleAdd("cart")}
            disabled={soldOut || adding}
            className="btn btn-primary flex-1 !py-4"
          >
            {adding ? (
              <Check className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
            )}
            {soldOut ? t("product.outOfStock") : t("product.addToCart")}
          </button>

          <button
            type="button"
            onClick={() => toggleWish(product.id)}
            className={cn(
              "grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border transition-all duration-300",
              wishHydrated && saved
                ? "border-ice-900 bg-ice-900 text-white"
                : "border-silver-300 bg-white text-ice-800 hover:border-ice-900",
            )}
            aria-label={wishHydrated && saved ? t("product.wishlistRemove") : t("product.wishlistAdd")}
            aria-pressed={wishHydrated && saved}
          >
            <Heart
              className="h-[18px] w-[18px]"
              strokeWidth={1.75}
              fill={wishHydrated && saved ? "currentColor" : "none"}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleAdd("checkout")}
          disabled={soldOut || adding}
          className="btn btn-ice w-full !py-4"
        >
          {t("product.buyNow")}
        </button>
      </div>

      {/* ---------------- accordions ---------------- */}
      <div className="divide-y divide-silver-200 border-y border-silver-200">
        <Accordion title={t("product.description")} defaultOpen>
          <p className="whitespace-pre-line">{localized(product, "description", locale)}</p>
        </Accordion>

        {details.length > 0 && (
          <Accordion title={t("product.details")}>
            <ul className="space-y-2">
              {details.map((d, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ice-400" />
                  {d}
                </li>
              ))}
            </ul>
          </Accordion>
        )}

        <Accordion title={t("product.shipping")}>
          <p className="whitespace-pre-line">{shippingNote}</p>
        </Accordion>
      </div>

      <p className="text-[11.5px] uppercase tracking-[0.12em] text-ice-400">
        {t("product.sku")} {product.sku}
      </p>

      <SizeChart
        product={product}
        open={chartOpen}
        onClose={() => setChartOpen(false)}
        highlight={size}
      />
    </div>
  );
}

function Pill({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "dark" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
        tone === "dark" ? "bg-ice-900 text-white" : "bg-ice-100 text-ice-800",
      )}
    >
      {children}
    </span>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-start"
      >
        <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-ice-900">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ice-600 transition-transform duration-400",
            open && "rotate-180",
          )}
          strokeWidth={1.75}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-5 text-[14px] leading-relaxed text-ice-700">{children}</div>
        </div>
      </div>
    </div>
  );
}
