"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Banner } from "@/lib/db/types";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import Reveal from "@/components/motion/Reveal";

export default function PromoBanner({ banner }: { banner: Banner }) {
  const { locale } = useI18n();
  const title = localized(banner, "title", locale);
  const subtitle = localized(banner, "subtitle", locale);
  const cta = localized(banner, "cta_label", locale);

  return (
    <section className="mw-container py-6">
      <Reveal>
        <Link
          href={banner.cta_href || "/shop"}
          className="group relative block overflow-hidden rounded-xl bg-ice-100"
        >
          <div className="relative aspect-16/10 w-full sm:aspect-21/9">
            {banner.image ? (
              <Image
                src={banner.image}
                alt={title}
                fill
                sizes="(max-width:1536px) 100vw, 1440px"
                className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(120deg,#f6fbff,#dceeff_45%,#9cc9ec)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-ice-950/75 via-ice-950/35 to-transparent rtl:bg-gradient-to-l" />
          </div>

          <div className="absolute inset-0 flex flex-col justify-center gap-3 p-7 sm:p-12 lg:p-16">
            <h2 className="display-md max-w-lg text-white uppercase">{title}</h2>
            {subtitle && <p className="max-w-md text-[15px] text-white/80">{subtitle}</p>}
            {cta && (
              <span className="mt-3 inline-flex w-fit items-center gap-2 border-b border-white/50 pb-1 text-[12px] font-medium uppercase tracking-[0.16em] text-white transition-all duration-500 group-hover:gap-4">
                {cta}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.75} />
              </span>
            )}
          </div>
        </Link>
      </Reveal>
    </section>
  );
}
