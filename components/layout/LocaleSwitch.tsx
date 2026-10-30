"use client";

import { LOCALES, LOCALE_LABEL } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export default function LocaleSwitch({
  solid = true,
  className,
}: {
  solid?: boolean;
  className?: string;
}) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={cn(
        "me-1 flex items-center rounded-full p-0.5 transition-colors duration-300",
        solid ? "bg-ice-100/70" : "bg-white/15",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => !active && setLocale(l)}
            aria-pressed={active}
            className={cn(
              "min-w-8 rounded-full px-2 py-1 text-[11px] font-semibold tracking-wider transition-all duration-300",
              active
                ? solid
                  ? "bg-ice-900 text-white"
                  : "bg-white text-ice-900"
                : solid
                  ? "text-ice-700 hover:text-ice-900"
                  : "text-white/70 hover:text-white",
            )}
          >
            {LOCALE_LABEL[l]}
          </button>
        );
      })}
    </div>
  );
}
