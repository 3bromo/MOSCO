export const LOCALES = ["en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "mosco_locale";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function dirOf(locale: Locale): "ltr" {
  return "ltr";
}

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  en: "EN",
};

export const LOCALE_NAME: Record<Locale, string> = {
  en: "English",
  en: "English",
};

/**
 * Picks the localized variant of a record field, falling back to the base
 * (English) value when a translation has not been entered in the admin.
 */
export function localized<T extends object>(
  row: T | null | undefined,
  field: string,
  locale: Locale,
): string {
  if (!row) return "";
  const bag = row as Record<string, unknown>;
  if (locale === "ar") {
    const v = bag[`${field}_ar`];
    if (typeof v === "string" && v.trim()) return v;
  }
  const base = bag[field];
  return typeof base === "string" ? base : "";
}

export function localizedList<T extends object>(
  row: T | null | undefined,
  field: string,
  locale: Locale,
): string[] {
  if (!row) return [];
  const bag = row as Record<string, unknown>;
  if (locale === "ar") {
    const v = bag[`${field}_ar`];
    if (Array.isArray(v) && v.length) return v as string[];
  }
  const base = bag[field];
  return Array.isArray(base) ? (base as string[]) : [];
}
