"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

/**
 * Rendered by app/not-found.tsx.
 *
 * Kept as a client component on purpose: the not-found boundary itself must stay
 * a synchronous server component, otherwise Next.js starts streaming before the
 * boundary resolves and the response goes out as HTTP 200 instead of 404.
 */
export default function NotFoundContent() {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-[72vh] items-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_50%_0%,#ffffff_0%,#f3f9ff_45%,#dceeff_100%)]"
      />
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#b9ddf8] opacity-40 blur-[110px]"
      />

      <div className="mw-container text-center">
        <p className="font-display text-[22vw] leading-none tracking-tighter text-white sm:text-[180px]">
          404
        </p>
        <h1 className="-mt-4 font-display text-2xl uppercase tracking-tight sm:text-3xl">
          {t("notFound.title")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ice-600">
          {t("notFound.sub")}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">
            {t("notFound.cta")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.75} />
          </Link>
          <Link href="/" className="btn btn-ghost">
            MOSCOW
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-ice-600">
          <Link href="/collections" className="link-underline inline-flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" strokeWidth={1.6} />
            {t("nav.collections")}
          </Link>
          <Link href="/track" className="link-underline">
            {t("nav.track")}
          </Link>
          <Link href="/contact" className="link-underline">
            {t("nav.contact")}
          </Link>
        </div>
      </div>
    </div>
  );
}
