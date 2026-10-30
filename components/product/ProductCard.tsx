"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/db/types";
import { totalStock } from "@/lib/db/types";
import { discountPercent, formatMoney } from "@/lib/money";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { useWishlist } from "@/lib/store/wishlist";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

export default function ProductCard({
  product,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
}) {
  const { t, locale } = useI18n();
  const toggle = useWishlist((s) => s.toggle);
  const saved = useWishlist((s) => s.ids.includes(product.id));
  const hydrated = useWishlist((s) => s.hydrated);
  const toast = useUI((s) => s.toast);
  const [hover, setHover] = useState(false);

  const primary = product.images[0];
  const secondary = product.images[1];
  const stock = totalStock(product);
  const off = discountPercent(product.price, product.compare_at_price);
  const name = localized(product, "name", locale);

  return (
    <article
      className="group relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg bg-ice-100">
          {primary ? (
            <>
              <Image
                src={primary.url}
                alt={localized(primary, "alt", locale) || name}
                fill
                sizes={sizes}
                priority={priority}
                className={cn(
                  "object-cover transition-all duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)]",
                  secondary && hover ? "scale-105 opacity-0" : "scale-100 opacity-100",
                  "group-hover:scale-105",
                )}
              />
              {secondary && (
                <Image
                  src={secondary.url}
                  alt={localized(secondary, "alt", locale) || name}
                  fill
                  sizes={sizes}
                  className={cn(
                    "object-cover transition-all duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)]",
                    hover ? "scale-105 opacity-100" : "scale-100 opacity-0",
                  )}
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-[11px] uppercase tracking-[0.2em] text-ice-500">
              {t("common.comingSoon")}
            </div>
          )}

          {/* badges */}
          <div className="pointer-events-none absolute start-3 top-3 flex flex-col items-start gap-1.5">
            {stock === 0 && (
              <Tag className="bg-ice-900 text-white">{t("common.soldOut")}</Tag>
            )}
            {off != null && stock > 0 && (
              <Tag className="bg-ice-900 text-white">−{off}%</Tag>
            )}
            {stock > 0 && off == null && product.badges.includes("new") && (
              <Tag className="bg-white/90 text-ice-900">{t("common.new")}</Tag>
            )}
            {stock > 0 && off == null && !product.badges.includes("new") && product.badges.includes("bestseller") && (
              <Tag className="bg-white/90 text-ice-900">{t("common.bestseller")}</Tag>
            )}
          </div>

          {/* subtle frost sweep on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ice-900/12 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        </div>
      </Link>

      <button
        type="button"
        onClick={() => {
          const added = toggle(product.id);
          toast(added ? t("product.wishlistRemove") : t("common.remove"), "success");
        }}
        className={cn(
          "absolute end-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition-all duration-300",
          hydrated && saved
            ? "bg-ice-900 text-white"
            : "bg-white/75 text-ice-800 hover:bg-white",
        )}
        aria-label={hydrated && saved ? t("product.wishlistRemove") : t("product.wishlistAdd")}
        aria-pressed={hydrated && saved}
      >
        <Heart
          className="h-[15px] w-[15px]"
          strokeWidth={1.75}
          fill={hydrated && saved ? "currentColor" : "none"}
        />
      </button>

      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-medium text-ice-900">
            <Link href={`/product/${product.slug}`} className="hover:underline">
              {name}
            </Link>
          </h3>
          {product.subtitle && (
            <p className="mt-0.5 truncate text-[12px] text-ice-500">
              {localized(product, "subtitle", locale)}
            </p>
          )}
        </div>
        <div className="shrink-0 text-end">
          <p className="text-[14px] font-medium tabular-nums text-ice-900">
            {formatMoney(product.price, locale)}
          </p>
          {product.compare_at_price ? (
            <p className="text-[12px] tabular-nums text-ice-500 line-through">
              {formatMoney(product.compare_at_price, locale)}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] backdrop-blur-md",
        className,
      )}
    >
      {children}
    </span>
  );
}
