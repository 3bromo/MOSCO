"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const OPTIONS = [
  ["newest", "shop.sort.newest"],
  ["popular", "shop.sort.popular"],
  ["price-asc", "shop.sort.priceAsc"],
  ["price-desc", "shop.sort.priceDesc"],
] as const;

export default function SortSelect() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const value = params.get("sort") ?? "newest";

  return (
    <div className={cn("relative", pending && "opacity-60")}>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === "newest") next.delete("sort");
          else next.set("sort", e.target.value);
          const qs = next.toString();
          start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
        }}
        aria-label={t("shop.sort")}
        className="h-11 cursor-pointer appearance-none rounded-full border border-silver-300 bg-white ps-4 pe-10 text-[13px] text-ice-900 outline-none transition-colors hover:border-ice-500 focus:border-ice-500"
      >
        {OPTIONS.map(([v, key]) => (
          <option key={v} value={v}>
            {t(key)}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ice-500"
        strokeWidth={1.75}
      />
    </div>
  );
}
