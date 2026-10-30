"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { ProductImage } from "@/lib/db/types";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { useIsTouch } from "@/lib/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

/**
 * Product gallery.
 * Desktop: hover-to-zoom on the active frame, click for a full-bleed lightbox.
 * Mobile: swipeable track with dots, tap for the lightbox.
 * Images are rendered untouched — object-contain on a neutral ice field so the
 * garment's real colour, stitching and proportions are never cropped or tinted.
 */
export default function ProductGallery({
  images,
  productName,
  badges,
}: {
  images: ProductImage[];
  productName: string;
  badges?: React.ReactNode;
}) {
  const { t, locale } = useI18n();
  const isTouch = useIsTouch();
  const [index, setIndex] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [lightbox, setLightbox] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const ordered = [...images].sort((a, b) => a.position - b.position);
  const active = ordered[index] ?? ordered[0];
  const count = ordered.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, index, go]);

  // Keep the mobile swipe track in sync when the index changes elsewhere.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !isTouch) return;
    const target = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) > 4) {
      el.scrollTo({ left: target, behavior: "smooth" });
    }
  }, [index, isTouch]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouch) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  if (!active) {
    return (
      <div className="aspect-4/5 w-full rounded-lg bg-ice-100" aria-hidden="true" />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-5">
        {/* ---------- main frame (desktop) ---------- */}
        <div className="relative hidden flex-1 lg:block">
          <div
            className="group relative aspect-4/5 w-full cursor-zoom-in overflow-hidden rounded-lg bg-ice-100"
            onMouseEnter={() => setZooming(true)}
            onMouseLeave={() => setZooming(false)}
            onMouseMove={onMove}
            onClick={() => setLightbox(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setLightbox(true)}
            aria-label={t("product.zoomHint")}
          >
            <Image
              key={active.id}
              src={active.url}
              alt={localized(active, "alt", locale) || productName}
              fill
              priority
              sizes="(max-width:1024px) 100vw, 55vw"
              className="object-cover transition-transform duration-[600ms] ease-out animate-fade-in"
              style={{
                transformOrigin: origin,
                transform: zooming ? "scale(2)" : "scale(1)",
              }}
            />
            <span className="pointer-events-none absolute end-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[11px] text-ice-800 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
              <ZoomIn className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t("product.zoomHint")}
            </span>
            {badges}
          </div>
        </div>

        {/* ---------- swipe track (mobile) ---------- */}
        <div className="relative lg:hidden">
          <div
            ref={trackRef}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg"
            onScroll={(e) => {
              const el = e.currentTarget;
              const i = Math.round(el.scrollLeft / el.clientWidth);
              if (i !== index) setIndex(i);
            }}
          >
            {ordered.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightbox(true)}
                className="relative aspect-4/5 w-full shrink-0 snap-center bg-ice-100"
                aria-label={t("product.imageOf", { n: i + 1, total: count })}
              >
                <Image
                  src={img.url}
                  alt={localized(img, "alt", locale) || productName}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {badges}

          {count > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {ordered.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={t("product.imageOf", { n: i + 1, total: count })}
                  aria-current={i === index}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-400",
                    i === index ? "w-6 bg-ice-900" : "w-1.5 bg-ice-900/30",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* ---------- thumbnails (desktop) ---------- */}
        {count > 1 && (
          <div className="hidden w-20 shrink-0 flex-col gap-3 lg:flex">
            {ordered.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t("product.imageOf", { n: i + 1, total: count })}
                aria-current={i === index}
                className={cn(
                  "relative aspect-4/5 w-full overflow-hidden rounded-md bg-ice-100 ring-1 transition-all duration-300",
                  i === index
                    ? "ring-2 ring-ice-900"
                    : "opacity-65 ring-silver-200 hover:opacity-100",
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---------- lightbox ---------- */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ice-950/92 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={productName}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute end-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="absolute start-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 rtl:rotate-180" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                className="absolute end-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 rtl:rotate-180" strokeWidth={1.5} />
              </button>
            </>
          )}

          <div className="relative h-[86vh] w-[94vw] max-w-5xl">
            <Image
              key={active.id}
              src={active.url}
              alt={localized(active, "alt", locale) || productName}
              fill
              sizes="94vw"
              className="object-contain animate-fade-in"
            />
          </div>

          <p className="absolute bottom-5 start-1/2 -translate-x-1/2 text-[12px] tabular-nums text-white/60 rtl:translate-x-1/2">
            {index + 1} / {count}
          </p>
        </div>
      )}
    </>
  );
}
