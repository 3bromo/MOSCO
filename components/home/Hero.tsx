"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks/useMediaQuery";
import { useWebGL } from "@/lib/hooks/useWebGL";
import { cn } from "@/lib/utils";
import type { Quality } from "@/components/three/IceCity";

// The 3D bundle is client-only and lazily fetched so it never blocks
// first paint, SSR, or any device that falls back to the 2D hero.
const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

export default function Hero({ title, subtitle }: { title: string; subtitle: string }) {
  const { t } = useI18n();
  const webgl = useWebGL();
  const reduced = usePrefersReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isCoarse = useMediaQuery("(hover: none) and (pointer: coarse)");

  const runway = useRef<HTMLElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);
  const progress = useRef(0);
  const [ready, setReady] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);

  const quality: Quality = isDesktop && !isCoarse ? "high" : "low";
  const use3D = webgl === "ok";

  /* --- scroll progress → camera + overlay, written straight to the DOM --- */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = runway.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const travel = Math.max(1, rect.height - window.innerHeight);
        const p = Math.min(1, Math.max(0, -rect.top / travel));
        progress.current = p;

        if (overlay.current) {
          // Overlay lifts and dissolves as the camera passes through the arch.
          const fade = Math.max(0, 1 - p * 1.6);
          overlay.current.style.opacity = String(fade);
          overlay.current.style.transform = `translate3d(0, ${-p * 70}px, 0) scale(${1 - p * 0.06})`;
        }
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* --- entrance choreography --- */
  useEffect(() => {
    if (!ready && use3D) return;
    if (reduced) {
      setLoaderGone(true);
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to("[data-hero-loader]", {
        opacity: 0,
        duration: 0.7,
        onComplete: () => setLoaderGone(true),
      })
        .from(
          "[data-hero-letter]",
          { yPercent: 115, duration: 1.15, stagger: 0.055, ease: "power4.out" },
          "-=0.35",
        )
        .from("[data-hero-eyebrow]", { opacity: 0, y: 14, duration: 0.7 }, "-=0.85")
        .from("[data-hero-sub]", { opacity: 0, y: 18, duration: 0.8 }, "-=0.6")
        .from("[data-hero-cta]", { opacity: 0, y: 16, duration: 0.7, stagger: 0.09 }, "-=0.55")
        .from("[data-hero-scroll]", { opacity: 0, duration: 0.6 }, "-=0.3");
    }, overlay);

    return () => ctx.revert();
  }, [ready, use3D, reduced]);

  // Without WebGL there is no canvas to wait for.
  useEffect(() => {
    if (webgl === "unsupported") setReady(true);
  }, [webgl]);

  const letters = (title || "MOSCOW").split("");

  return (
    <section
      ref={runway}
      className="relative"
      style={{ height: isDesktop ? "195vh" : "165svh" }}
      aria-label="MOSCOW"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* sky — a real gradient behind a transparent canvas is cheaper than
            rendering a skydome, and gives crisp control over the palette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg,#f8fcff 0%,#eaf5ff 28%,#dceeff 58%,#c9e4fb 82%,#b9ddf8 100%)",
          }}
        />
        {/* sun bloom */}
        <div
          className="absolute left-1/2 top-[14%] h-[46vmin] w-[46vmin] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(255,255,255,.95) 0%,rgba(255,255,255,.45) 38%,rgba(255,255,255,0) 70%)",
            filter: "blur(4px)",
          }}
        />

        {use3D ? (
          <div className="absolute inset-0">
            <HeroScene
              progressRef={progress}
              quality={quality}
              reducedMotion={reduced}
              onReady={() => setReady(true)}
            />
          </div>
        ) : (
          <Fallback2D />
        )}

        {/* vignette + bottom blend into the page */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 95% at 50% 42%,transparent 48%,rgba(23,42,64,.1) 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ice-50" />

        {/* ---------------- overlay typography ---------------- */}
        <div
          ref={overlay}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center"
          style={{ willChange: "transform, opacity" }}
        >
          <p
            data-hero-eyebrow
            className="eyebrow !text-ice-700/90 mb-5 sm:mb-7"
            style={{ letterSpacing: "0.34em" }}
          >
            {t("home.eyebrow")}
          </p>

          <h1
            ref={wordRef}
            className="display-xl flex items-baseline justify-center text-ice-900"
            aria-label={title}
          >
            {letters.map((ch, i) => (
              <span key={i} className="inline-block overflow-hidden" aria-hidden="true">
                <span data-hero-letter className="inline-block">
                  {ch === " " ? "\u00A0" : ch}
                </span>
              </span>
            ))}
          </h1>

          <p
            data-hero-sub
            className="mt-6 max-w-md text-[15px] leading-relaxed text-ice-800 sm:mt-7 sm:text-base"
          >
            {subtitle}
          </p>

          <div className="pointer-events-auto mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link data-hero-cta href="/shop" className="btn btn-primary">
              {t("home.heroCta")}
            </Link>
            <Link
              data-hero-cta
              href="/about"
              className="btn btn-ghost border-ice-900/25 bg-white/55 backdrop-blur-md"
            >
              {t("home.heroCta2")}
            </Link>
          </div>

          <div
            data-hero-scroll
            className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-ice-700"
          >
            <span className="eyebrow !text-ice-600">{t("home.scroll")}</span>
            <ArrowDown className="h-4 w-4 animate-drift" strokeWidth={1.5} />
          </div>
        </div>

        {/* ---------------- loading curtain ---------------- */}
        {!loaderGone && (
          <div
            data-hero-loader
            className={cn(
              "absolute inset-0 z-20 flex flex-col items-center justify-center gap-5",
              "bg-gradient-to-b from-[#f8fcff] via-[#eaf5ff] to-[#dceeff]",
            )}
          >
            <span className="font-display text-[13px] uppercase tracking-[0.42em] text-ice-800">
              Moscow
            </span>
            <span className="relative block h-px w-40 overflow-hidden bg-ice-300">
              <span className="absolute inset-y-0 start-0 w-full origin-left animate-[mw-shimmer_1.4s_ease-in-out_infinite] bg-ice-800" />
            </span>
            <span className="eyebrow !text-ice-600">{t("home.loading")}</span>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * No-WebGL fallback — pure CSS arctic horizon. Light, static, on-brand.
 * ------------------------------------------------------------------ */
function Fallback2D() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* far ridge */}
      <div
        className="absolute inset-x-0 bottom-[32%] h-[26vh]"
        style={{
          background: "linear-gradient(180deg,#cfe7fd 0%,#b9ddf8 100%)",
          clipPath:
            "polygon(0% 100%,0% 58%,12% 34%,22% 52%,34% 22%,46% 46%,58% 18%,70% 44%,82% 28%,92% 50%,100% 36%,100% 100%)",
          opacity: 0.85,
        }}
      />
      {/* near ridge */}
      <div
        className="absolute inset-x-0 bottom-[22%] h-[24vh]"
        style={{
          background: "linear-gradient(180deg,#e8f4ff 0%,#cfe7fd 100%)",
          clipPath:
            "polygon(0% 100%,0% 70%,15% 44%,28% 64%,40% 36%,55% 58%,68% 32%,80% 56%,92% 40%,100% 62%,100% 100%)",
        }}
      />
      {/* ice blocks suggesting the arch */}
      <div className="absolute inset-x-0 bottom-0 h-[34vh] bg-gradient-to-b from-[#eaf5ff] to-white" />
      <div className="absolute bottom-[26%] left-1/2 h-[30vh] w-[min(620px,78vw)] -translate-x-1/2">
        <div className="grid h-full grid-cols-6 grid-rows-4 gap-1.5 opacity-55">
          {Array.from({ length: 24 }).map((_, i) => {
            const col = i % 6;
            const row = Math.floor(i / 6);
            const inArch = col >= 2 && col <= 3 && row >= 1;
            return (
              <div
                key={i}
                className={cn(
                  "rounded-[3px]",
                  inArch ? "bg-transparent" : "bg-white/85 shadow-[inset_0_0_12px_rgba(156,201,236,.5)]",
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
