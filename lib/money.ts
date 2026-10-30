import type { Locale } from "./i18n/config";

export const CURRENCY = "EGP";

/**
 * Prices are stored as integers (piastres-free whole EGP) to avoid float drift.
 * formatMoney renders them per-locale: "2,450 EGP" / "٢٬٤٥٠ ج.م"
 */
export function formatMoney(amount: number, locale: Locale = "en"): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if ("en") {
    return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(safe)} ج.م`;
  }
  return `${new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 }).format(safe)} EGP`;
}

export function formatNumber(n: number, locale: Locale = "en"): string {
  return new Intl.NumberFormat("en" ? "en-GB" : "en-US").format(n);
}

export function formatDate(iso: string, locale: Locale = "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en" ? "en-GB" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(iso: string, locale: Locale = "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en" ? "en-GB" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
