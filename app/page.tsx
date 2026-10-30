import Link from "next/link";
import BrandIntro from "@/components/home/BrandIntro";
import CategoryGrid from "@/components/home/CategoryGrid";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import PromoBanner from "@/components/home/PromoBanner";
import StoryBlock from "@/components/home/StoryBlock";
import ProductGrid from "@/components/product/ProductGrid";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import { db, productsInCollection } from "@/lib/db";
import { localized } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const t = (k: string) => translate(locale, k);
  const repo = db();

  const [settings, collections, allProducts] = await Promise.all([
    repo.getSettings(),
    repo.listCollections(),
    repo.listProducts({ sort: "newest" }),
  ]);

  const counts: Record<string, number> = {};
  for (const c of collections) counts[c.slug] = productsInCollection(allProducts, c).length;

  const newArrivals = allProducts.filter((p) => p.badges.includes("new")).slice(0, 4);
  const bestSellers = [...allProducts]
    .filter((p) => p.badges.includes("bestseller"))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 4);
  const featured = allProducts.filter((p) => p.featured);

  const categories = collections.filter((c) => c.kind === "category" && c.visible).slice(0, 4);
  const edits = collections.filter((c) => c.kind === "collection" && c.visible).slice(0, 4);
  const homeBanner = settings.banners?.find((b) => b.placement === "home" && b.visible);

  return (
    <>
      <Hero
        title={localized(settings, "home_hero_title", locale) || "MOSCOW"}
        subtitle={localized(settings, "home_hero_sub", locale)}
      />

      <Marquee />

      <BrandIntro />

      {/* ---------------- New Arrivals ---------------- */}
      {newArrivals.length > 0 && (
        <section className="mw-container py-16 sm:py-20">
          <SectionHeader
            eyebrow={t("home.featured")}
            title={t("home.newArrivals")}
            subtitle={t("home.newArrivalsSub")}
            href="/collections/new-arrivals"
            hrefLabel={t("common.viewAll")}
          />
          <ProductGrid products={newArrivals} columns={4} priorityCount={2} />
        </section>
      )}

      {/* ---------------- Shop by Category ---------------- */}
      <section className="mw-container py-16 sm:py-20">
        <SectionHeader
          eyebrow={t("nav.shop")}
          title={t("home.categories")}
          subtitle={t("home.categoriesSub")}
          href="/shop"
          hrefLabel={t("shop.title")}
        />
        <CategoryGrid collections={categories} counts={counts} />
      </section>

      {/* ---------------- Promo banner ---------------- */}
      {homeBanner && <PromoBanner banner={homeBanner} />}

      {/* ---------------- Best Sellers ---------------- */}
      {bestSellers.length > 0 && (
        <section className="mw-container py-16 sm:py-20">
          <SectionHeader
            eyebrow={t("common.bestseller")}
            title={t("home.bestSellers")}
            subtitle={t("home.bestSellersSub")}
            href="/collections/best-sellers"
            hrefLabel={t("common.viewAll")}
          />
          <ProductGrid products={bestSellers} columns={4} />
        </section>
      )}

      {/* ---------------- Brand story ---------------- */}
      <StoryBlock
        title={localized(settings, "home_story_title", locale)}
        body={localized(settings, "home_story_body", locale)}
        image={settings.home_story_image}
      />

      {/* ---------------- Featured collections ---------------- */}
      <section className="mw-container py-16 sm:py-24">
        <SectionHeader
          eyebrow={t("nav.collections")}
          title={t("home.collections")}
          subtitle={t("home.collectionsSub")}
          href="/collections"
          hrefLabel={t("common.viewAll")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {edits.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.05}>
              <Link
                href={`/collections/${c.slug}`}
                className="group flex h-full flex-col justify-between rounded-lg border border-silver-200 bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:border-ice-300 hover:shadow-frost"
              >
                <div>
                  <p className="eyebrow">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-4 font-display text-2xl uppercase tracking-tight text-ice-900">
                    {localized(c, "name", locale)}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-ice-600">
                    {localized(c, "description", locale)}
                  </p>
                </div>
                <p className="mt-8 text-[11px] uppercase tracking-[0.16em] text-ice-500">
                  {counts[c.slug]
                    ? `${counts[c.slug]} ${counts[c.slug] === 1 ? t("common.result") : t("common.results")}`
                    : t("common.comingSoon")}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Featured products ---------------- */}
      {featured.length > 0 && (
        <section className="border-t border-silver-200 bg-white">
          <div className="mw-container py-16 sm:py-20">
            <SectionHeader
              eyebrow={t("home.featured")}
              title={t("shop.title")}
              subtitle={t("shop.sub")}
              href="/shop"
              hrefLabel={t("common.viewAll")}
            />
            <ProductGrid products={featured} columns={3} />
          </div>
        </section>
      )}
    </>
  );
}
