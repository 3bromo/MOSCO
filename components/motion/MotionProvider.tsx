"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single GSAP entry point for the whole site.
 *
 * - Registers ScrollTrigger once.
 * - Batch-reveals any element marked `data-reveal` (optionally `data-reveal-delay`).
 * - Drives `data-parallax` elements with a light y-translation.
 * - Rebuilds on route change and fully disables itself under
 *   prefers-reduced-motion, where elements are shown immediately.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = gsap.utils.toArray<HTMLElement>("[data-reveal]");
    const parallax = gsap.utils.toArray<HTMLElement>("[data-parallax]");

    if (reduced) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // --- scroll reveals -------------------------------------------------
      ScrollTrigger.batch(nodes, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          batch.forEach((el, i) => {
            const extra = parseFloat((el as HTMLElement).dataset.revealDelay || "0");
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.95,
              ease: "power3.out",
              delay: i * 0.07 + extra,
              onStart: () => el.classList.add("is-in"),
            });
          });
        },
      });

      // Anything already above the fold on load should not wait for a scroll.
      nodes.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.9) {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
          el.classList.add("is-in");
        }
      });

      // --- parallax -------------------------------------------------------
      parallax.forEach((el) => {
        const strength = parseFloat(el.dataset.parallax || "12");
        gsap.fromTo(
          el,
          { yPercent: -strength / 2 },
          {
            yPercent: strength / 2,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    });

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 320);

    return () => {
      window.clearTimeout(refresh);
      ctx.revert();
    };
  }, [pathname]);

  return <>{children}</>;
}
