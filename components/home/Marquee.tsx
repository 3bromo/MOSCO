"use client";

import { useI18n } from "@/lib/i18n/context";

const WORDS_EN = [
  "Jacquard Denim",
  "Woven Monogram",
  "Cut in Small Runs",
  "Built for the Cold",
  "Cash on Delivery",
  "InstaPay",
];
const WORDS_AR = [
  "دينيم جاكار",
  "مونوجرام منسوج",
  "إنتاج بكميات صغيرة",
  "صُنع للبرد",
  "الدفع عند الاستلام",
  "إنستاباي",
];

/**
 * Infinite editorial ticker. Duplicated track + CSS keyframes = no JS on the
 * main thread; pauses for reduced-motion users via the global CSS rule.
 */
export default function Marquee() {
  const { locale } = useI18n();
  const words = locale === "ar" ? WORDS_AR : WORDS_EN;
  const track = [...words, ...words];

  return (
    <div className="relative overflow-hidden border-y border-silver-200 bg-white py-4">
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-16 bg-gradient-to-r from-white to-transparent rtl:bg-gradient-to-l" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-16 bg-gradient-to-l from-white to-transparent rtl:bg-gradient-to-r" />

      <div className="flex w-max animate-[mw-marquee_38s_linear_infinite] items-center gap-10 will-change-transform">
        {track.map((w, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">
            <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-ice-600">
              {w}
            </span>
            <span className="h-1 w-1 rounded-full bg-ice-300" />
          </span>
        ))}
      </div>

      <style jsx global>{`
        @keyframes mw-marquee {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }
        [dir="rtl"] .animate-\\[mw-marquee_38s_linear_infinite\\] {
          animation-direction: reverse;
        }
      `}</style>
    </div>
  );
}
