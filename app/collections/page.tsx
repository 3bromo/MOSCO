import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Reveal from "@/components/motion/Reveal";
import { db } from "@/lib/db";
import { localized } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = "en";
  return {
    title: translate(locale, "nav.collections"),
    description: translate(locale, "home.collectionsSub"),
    alternates: { canonical: "/collections" },
  };
}

export default async function CollectionsPage() {
  const locale = "en";
  const t = (k: string) => translate(locale, k);
  const repo = db();

  const [collections, products] = await Promise.all([repo.listCollections(), repo.listProducts({})]);

  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title={t("nav.collections")}
        subtitle={t("home.collectionsSub")}
        crumbs={[{ label: "MOSCOW", href: "/" }, { label: t("nav.collections") }]}
        tone="ice"
      />

      <div className="mw-container grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3 sm:py-16">
        {collections.map((c, i) => {
          const count = products.reduce(
            (acc, p) => {
              const collProducts = p.collections || [];
              return collProducts.includes(c.id) ? acc + 1 : acc;
            },
            0
          );
          const cover = c.image ?? products.filter((p) => p.collections?.includes(c.id))[0]?.images[0]?.url ?? null;

          return (
            <Reveal key={c.id} delay={(i % 3) * 0.06}>
              <Link
                href={`/collections/${c.slug}`}
                className="group relative block overflow-hidden rounded-lg bg-ice-100"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-ice-100">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={localized(c, "name", locale)}
                      fill
                      sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 bg-[radial-gradient(130%_100%_at_25%_10%,#f6fbff_0%,#dceeff_50%,#9cc9ec_100%)]"
                    />
                  )}
                  <div
                    className={cn(
                      "absolute inset-0",
                      cover ? "bg-gradient-to-t from-ice-950/70 via-ice-950/10 to-transparent" : "bg-gradient-to-t from-ice-900/25 to-transparent",
                    )}
                  />
                </div>

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <h2
                      className={cn(
                        "font-display text-2xl uppercase tracking-tight",
                        cover ? "text-white" : "text-ice-900",
                      )}
                    >
                      {localized(c, "name", locale)}
                    </h2>
                    <p
                      className={cn(
                        "mt-1 line-clamp-1 text-[13px]",
                        cover ? "text-white/75" : "text-ice-700",
                      )}
                    >
                      {localized(c, "description", locale)}
                    </p>
                    <p
                      className={cn(
                        "mt-1.5 text-[11px] uppercase tracking-[0.14em]",
                        cover ? "text-white/60" : "text-ice-600",
                      )}
                    >
                      {count
                        ? `${count} ${count === 1 ? "result" : "results"}`
                        : "Coming Soon"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform duration-500 group-hover:rotate-45",
                      cover ? "bg-white/20 text-white backdrop-blur-md" : "bg-white text-ice-900",
                    )}
                  >
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
