"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Product, SizeRow } from "@/lib/db/types";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { cmToIn, cn, round } from "@/lib/utils";

/** Column order is fixed; only columns this product actually publishes show. */
const COLUMNS: { key: keyof SizeRow; label: string }[] = [
  { key: "chest", label: "chart.chest" },
  { key: "shoulder", label: "chart.shoulder" },
  { key: "sleeve", label: "chart.sleeve" },
  { key: "length", label: "chart.length" },
  { key: "waist", label: "chart.waist" },
  { key: "hip", label: "chart.hip" },
  { key: "thigh", label: "chart.thigh" },
  { key: "inseam", label: "chart.inseam" },
  { key: "legOpening", label: "chart.legOpening" },
];

export default function SizeChart({
  product,
  open,
  onClose,
  highlight,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
  highlight?: string | null;
}) {
  const { t, locale } = useI18n();
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  // Only render columns that carry data on THIS product — no universal chart.
  const columns = useMemo(
    () => COLUMNS.filter((c) => product.sizes.some((s) => typeof s[c.key] === "number")),
    [product.sizes],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const fmt = (v: number | null | undefined) => {
    if (typeof v !== "number") return "—";
    return unit === "cm" ? round(v, 1) : round(cmToIn(v), 1);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ice-950/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        className="relative flex max-h-[90dvh] w-full max-w-3xl flex-col rounded-t-2xl bg-white shadow-2xl animate-fade-up sm:rounded-xl"
        role="dialog"
        aria-modal="true"
        aria-label={t("chart.title")}
      >
        <header className="flex items-start justify-between gap-4 border-b border-silver-200 px-5 py-4 sm:px-7">
          <div>
            <h2 className="font-display text-xl uppercase tracking-tight">{t("chart.title")}</h2>
            <p className="mt-1 text-[13px] text-ice-600">
              {t("chart.sub")} — {localized(product, "name", locale)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-me-2 grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-ice-100"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>

        <div className="flex items-center justify-between gap-3 border-b border-silver-200 px-5 py-3 sm:px-7">
          <p className="text-[12px] text-ice-500">{t("chart.garmentNote")}</p>
          <div className="flex rounded-full bg-ice-100 p-0.5" role="group" aria-label="Units">
            {(["cm", "in"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                aria-pressed={unit === u}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[12px] font-medium transition-all duration-300",
                  unit === u ? "bg-ice-900 text-white" : "text-ice-700 hover:text-ice-900",
                )}
              >
                {t(u === "cm" ? "chart.cm" : "chart.in")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto overscroll-contain px-5 py-5 sm:px-7">
          {columns.length === 0 ? (
            <p className="py-10 text-center text-sm text-ice-600">{t("chart.none")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-silver-300">
                    <th className="sticky start-0 bg-white px-3 py-3 text-start text-[11px] font-semibold uppercase tracking-[0.1em] text-ice-700">
                      {t("chart.size")}
                    </th>
                    {columns.map((c) => (
                      <th
                        key={String(c.key)}
                        className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-ice-700 whitespace-nowrap"
                      >
                        {t(c.label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {product.sizes.map((row) => {
                    const on = highlight === row.size;
                    return (
                      <tr
                        key={row.size}
                        className={cn(
                          "border-b border-silver-200 transition-colors",
                          on ? "bg-ice-100" : "hover:bg-ice-50",
                        )}
                      >
                        <th
                          scope="row"
                          className={cn(
                            "sticky start-0 px-3 py-3 text-start font-medium whitespace-nowrap",
                            on ? "bg-ice-100 text-ice-900" : "bg-white text-ice-900",
                          )}
                        >
                          {row.size}
                          {row.stock <= 0 && (
                            <span className="ms-2 text-[10px] font-normal uppercase tracking-wider text-ice-400">
                              {t("common.soldOut")}
                            </span>
                          )}
                        </th>
                        {columns.map((c) => (
                          <td
                            key={String(c.key)}
                            className="px-3 py-3 text-center tabular-nums text-ice-700"
                          >
                            {fmt(row[c.key] as number | null | undefined)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {localized(product, "size_note", locale) && (
            <div className="mt-6 rounded-lg bg-ice-50 p-4">
              <h3 className="eyebrow mb-2">{t("chart.howTo")}</h3>
              <p className="text-[13px] leading-relaxed text-ice-700">
                {localized(product, "size_note", locale)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
