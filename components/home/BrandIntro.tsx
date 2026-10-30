"use client";

import { useI18n } from "@/lib/i18n/context";
import Reveal from "@/components/motion/Reveal";

const STATS = [
  { value: "13.5oz", key: "Jacquard denim", key_ar: "دينيم جاكار" },
  { value: "100%", key: "Cotton", key_ar: "قطن" },
  { value: "27", key: "Governorates served", key_ar: "محافظة نخدمها" },
  { value: "48h", key: "Dispatch", key_ar: "الشحن" },
];

export default function BrandIntro() {
  const { t, locale } = useI18n();

  return (
    <section className="mw-container py-20 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow mb-4">{t("home.introEyebrow")}</p>
          <h2 className="display-lg text-ice-900">{t("home.introTitle")}</h2>
        </Reveal>

        <div className="lg:col-span-7">
          <Reveal delay={0.1}>
            <p className="text-[17px] leading-[1.75] text-ice-700 sm:text-[19px]">
              {t("home.introBody")}
            </p>
          </Reveal>

          <Reveal delay={0.2} className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.value} className="border-t border-silver-300 pt-4">
                <p className="font-display text-2xl tracking-tight text-ice-900 sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-ice-500">
                  {"en" ? s.key_ar : s.key}
                </p>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
