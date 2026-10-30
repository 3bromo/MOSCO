"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Collection } from "@/lib/db/types";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import Reveal from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export default function CategoryGrid({
  collections,
  counts,
}: {
  collections: Collection[];
  counts: Record<string, number>;
}) {
  const { t, locale } = useI18n();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {collections.map((c, i) => {
        const count = counts[c.slug] ?? 0;
        const empty = count === 0;

        return (
          <Reveal key={c.id} delay={i * 0.05}>
            <Link
              href={`/collections/${c.slug}`}
              className="group relative block overflow-hidden rounded-lg bg-ice-100"
            >
              <div className="relative aspect-4/5 w-full overflow-hidden">
                {c.image ? (
                  <Image
                    src={c.image}
                    alt={localized(c, "name", locale)}
                    fill
                    sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.07]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(130%_100%_at_30%_15%,#f6fbff_0%,#dceeff_45%,#9cc9ec_100%)]" />
                )}

                <div
                  className={cn(
                    "absolute inset-0 transition-opacity duration-700",
                    c.image
                      ? "bg-gradient-to-t from-ice-950/72 via-ice-950/15 to-transparent"
                      : "bg-gradient-to-t from-ice-900/40 via-transparent to-transparent",
                  )}
                />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <div>
                    <h3
                      className={cn(
                        "font-display text-xl uppercase tracking-tight sm:text-2xl",
                        c.image ? "text-white" : "text-ice-900",
                      )}
                    >
                      {localized(c, "name", locale)}
                    </h3>
                    <p
                      className={cn(
                        "mt-1 text-[11px] uppercase tracking-[0.14em]",
                        c.image ? "text-white/70" : "text-ice-700",
                      )}
                    >
                      {empty
                        ? t("common.comingSoon")
                        : `${count} ${count === 1 ? t("common.result") : t("common.results")}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-500 group-hover:rotate-45",
                      c.image ? "bg-white/20 text-white backdrop-blur-md" : "bg-white text-ice-900",
                    )}
                  >
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
