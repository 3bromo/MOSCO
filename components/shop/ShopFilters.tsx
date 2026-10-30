"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { Collection } from "@/lib/db/types";
import { formatMoney } from "@/lib/money";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

export interface Facets {
  sizes: string[];
  colors: { name: string; hex: string; count: number }[];
  categories: { slug: string; count: number }[];
  minPrice: number;
  maxPrice: number;
}

export default function ShopFilters({
  facets,
  collections,
  total,
}: {
  facets: Facets;
  collections: Collection[];
  total: number;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const mobileOpen = useUI((s) => s.filtersOpen);
  const setMobileOpen = useUI((s) => s.setFiltersOpen);

  const current = useMemo(
    () => ({
      category: params.getAll("category"),
      collection: params.getAll("collection"),
      size: params.getAll("size"),
      color: params.getAll("color"),
      min: params.get("min"),
      max: params.get("max"),
      instock: params.get("instock") === "1",
      q: params.get("q") ?? "",
      sort: params.get("sort") ?? "newest",
    }),
    [params],
  );

  const [priceMax, setPriceMax] = useState<number>(
    current.max ? Number(current.max) : facets.maxPrice,
  );

  useEffect(() => {
    setPriceMax(current.max ? Number(current.max) : facets.maxPrice);
  }, [current.max, facets.maxPrice]);

  const push = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router],
  );

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const existing = next.getAll(key);
      next.delete(key);
      const after = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value];
      after.forEach((v) => next.append(key, v));
      push(next);
    },
    [params, push],
  );

  const setSingle = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value == null || value === "") next.delete(key);
      else next.set(key, value);
      push(next);
    },
    [params, push],
  );

  const clearAll = useCallback(() => {
    const next = new URLSearchParams();
    if (current.q) next.set("q", current.q);
    if (current.sort !== "newest") next.set("sort", current.sort);
    push(next);
  }, [current.q, current.sort, push]);

  const activeCount =
    current.category.length +
    current.collection.length +
    current.size.length +
    current.color.length +
    (current.min ? 1 : 0) +
    (current.max ? 1 : 0) +
    (current.instock ? 1 : 0);

  const categoryCollections = collections.filter((c) => c.kind === "category");
  const editCollections = collections.filter((c) => c.kind === "collection");

  const panel = (
    <div className={cn("space-y-8", pending && "opacity-60 transition-opacity")}>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ice-700 underline underline-offset-4 hover:text-ice-900"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
          {t("common.clearAll")} ({activeCount})
        </button>
      )}

      <Group title={t("shop.category")}>
        {categoryCollections.map((c) => (
          <Check
            key={c.id}
            label={localized(c, "name", locale)}
            checked={current.category.includes(c.slug)}
            onChange={() => toggleMulti("category", c.slug)}
            count={facets.categories.find((f) => f.slug === c.slug)?.count}
          />
        ))}
      </Group>

      <Group title={t("shop.collection")}>
        {editCollections.map((c) => (
          <Check
            key={c.id}
            label={localized(c, "name", locale)}
            checked={current.collection.includes(c.slug)}
            onChange={() => toggleMulti("collection", c.slug)}
          />
        ))}
      </Group>

      {facets.sizes.length > 0 && (
        <Group title={t("shop.size")}>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const on = current.size.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleMulti("size", s)}
                  aria-pressed={on}
                  className={cn(
                    "min-w-[46px] rounded-md border px-3 py-2 text-[13px] transition-all duration-200",
                    on
                      ? "border-ice-900 bg-ice-900 text-white"
                      : "border-silver-300 bg-white text-ice-800 hover:border-ice-500",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {facets.colors.length > 0 && (
        <Group title={t("shop.color")}>
          <div className="flex flex-wrap gap-2.5">
            {facets.colors.map((c) => {
              const on = current.color.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggleMulti("color", c.name)}
                  aria-pressed={on}
                  title={c.name}
                  className={cn(
                    "flex items-center gap-2 rounded-full border py-1.5 pe-3.5 ps-1.5 text-[12px] transition-all duration-200",
                    on
                      ? "border-ice-900 bg-ice-50 text-ice-900"
                      : "border-silver-300 bg-white text-ice-700 hover:border-ice-500",
                  )}
                >
                  <span
                    className="h-5 w-5 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.name}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      <Group title={t("shop.price")}>
        <div className="px-0.5">
          <input
            type="range"
            min={facets.minPrice}
            max={facets.maxPrice}
            step={50}
            value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            onMouseUp={() =>
              setSingle("max", priceMax >= facets.maxPrice ? null : String(priceMax))
            }
            onTouchEnd={() =>
              setSingle("max", priceMax >= facets.maxPrice ? null : String(priceMax))
            }
            onKeyUp={() => setSingle("max", priceMax >= facets.maxPrice ? null : String(priceMax))}
            className="w-full accent-ice-900"
            aria-label={t("shop.price")}
          />
          <div className="mt-2 flex items-center justify-between text-[12px] tabular-nums text-ice-600">
            <span>{formatMoney(facets.minPrice, locale)}</span>
            <span className="font-medium text-ice-900">{formatMoney(priceMax, locale)}</span>
          </div>
        </div>
      </Group>

      <Group title={t("shop.availability")}>
        <Check
          label={t("shop.inStockOnly")}
          checked={current.instock}
          onChange={() => setSingle("instock", current.instock ? null : "1")}
        />
      </Group>
    </div>
  );

  return (
    <>
      {/* desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block xl:w-64">
        <div className="sticky top-[calc(var(--header-h)+24px)] max-h-[calc(100vh-var(--header-h)-48px)] overflow-y-auto pe-2">
          {panel}
        </div>
      </aside>

      {/* mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-ice-950/35 backdrop-blur-sm transition-opacity duration-400",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl bg-white transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
            mobileOpen ? "translate-y-0" : "translate-y-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label={t("shop.filters")}
        >
          <div className="flex items-center justify-between border-b border-silver-200 px-5 py-4">
            <h2 className="font-display text-lg uppercase tracking-tight">{t("shop.filters")}</h2>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-ice-100"
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">{panel}</div>
          <div className="border-t border-silver-200 p-4">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="btn btn-primary w-full"
            >
              {t("shop.applyFilters")} ({total})
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="eyebrow mb-3.5">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Check({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ice-800 select-none">
      <span
        className={cn(
          "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[4px] border transition-all duration-200",
          checked ? "border-ice-900 bg-ice-900" : "border-silver-400 bg-white",
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" aria-hidden="true">
            <path
              d="M1.5 6.2 4.4 9l6-6.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className="flex-1">{label}</span>
      {typeof count === "number" && (
        <span className="text-[12px] tabular-nums text-ice-400">{count}</span>
      )}
    </label>
  );
}
