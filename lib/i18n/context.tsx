"use client";

import { createContext, useCallback, useContext, useMemo, useTransition } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirOf, type Locale } from "./config";
import { translate } from "./dictionaries";

type Ctx = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (l: Locale) => void;
  switching: boolean;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const [switching, start] = useTransition();

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  const setLocale = useCallback(
    (l: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      const html = document.documentElement;
      html.lang = l;
      html.dir = dirOf(l);
      start(() => {
        // Full refresh so server components re-render with the new locale.
        window.location.reload();
      });
    },
    [start],
  );

  const value = useMemo<Ctx>(
    () => ({ locale, dir: dirOf(locale), t, setLocale, switching }),
    [locale, t, setLocale, switching],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so isolated components never crash outside the provider.
    return {
      locale: DEFAULT_LOCALE,
      dir: "ltr",
      t: (k, v) => translate(DEFAULT_LOCALE, k, v),
      setLocale: () => {},
      switching: false,
    };
  }
  return ctx;
}

export function useT() {
  return useI18n().t;
}
