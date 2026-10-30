"use client";

import type { Product } from "@/lib/db/types";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import Reveal from "@/components/motion/Reveal";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  columns = 4,
  priorityCount = 0,
  className,
  emptyTitle,
  emptyHint,
}: {
  products: Product[];
  columns?: 2 | 3 | 4;
  priorityCount?: number;
  className?: string;
  emptyTitle?: string;
  emptyHint?: string;
}) {
  const { t } = useI18n();

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-silver-300 bg-white/60 px-6 py-20 text-center">
        <p className="font-display text-xl uppercase tracking-tight text-ice-900">
          {emptyTitle ?? t("shop.noResults")}
        </p>
        <p className="mt-2 max-w-sm text-sm text-ice-600">{emptyHint ?? t("shop.noResultsHint")}</p>
      </div>
    );
  }

  const cols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12", cols, className)}>
      {products.map((p, i) => (
        <Reveal key={p.id} delay={Math.min(i, 5) * 0.04}>
          <ProductCard
            product={p}
            priority={i < priorityCount}
            sizes={
              columns === 2
                ? "(max-width:640px) 50vw, 50vw"
                : columns === 3
                  ? "(max-width:640px) 50vw,(max-width:1024px) 33vw, 33vw"
                  : "(max-width:640px) 50vw,(max-width:1024px) 33vw, 25vw"
            }
          />
        </Reveal>
      ))}
    </div>
  );
}
