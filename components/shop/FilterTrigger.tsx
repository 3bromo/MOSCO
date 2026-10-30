"use client";

import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useUI } from "@/lib/store/ui";

/** Mobile-only button that opens the filter sheet rendered by ShopFilters. */
export default function FilterTrigger() {
  const { t } = useI18n();
  const setOpen = useUI((s) => s.setFiltersOpen);
  const params = useSearchParams();

  const activeCount =
    params.getAll("category").length +
    params.getAll("collection").length +
    params.getAll("size").length +
    params.getAll("color").length +
    (params.get("min") ? 1 : 0) +
    (params.get("max") ? 1 : 0) +
    (params.get("instock") ? 1 : 0);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-silver-300 bg-white px-4 text-[13px] text-ice-900 transition-colors hover:border-ice-500 lg:hidden"
    >
      <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
      {t("shop.filters")}
      {activeCount > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ice-900 px-1 text-[10px] text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}
