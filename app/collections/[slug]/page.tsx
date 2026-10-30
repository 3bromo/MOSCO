import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FilterTrigger from "@/components/shop/FilterTrigger";
import ProductGrid from "@/components/product/ProductGrid";
import ShopFilters from "@/components/shop/ShopFilters";
import SortSelect from "@/components/shop/SortSelect";
import PageHeader from "@/components/ui/PageHeader";
import { buildFacets, db, filterProducts, productsInCollection } from "@/lib/db";
import type { ProductQuery } from "@/lib/db/types";
import { localized } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function arr(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const c = await db().getCollectionBySlug(slug);
  if (!c) return { title: translate(locale, "notFound.title") };
  return {
    title: localized(c, "name", locale),
    description: localized(c, "description", locale),
    alternates: { canonical: `/collections/${c.slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const locale = await getLocale();
  const t = (k: string) => translate(locale, k);
  const repo = db();

  const collection = await repo.getCollectionBySlug(slug);
  if (!collection || !collection.visible) notFound();

  const [all, collections] = await Promise.all([repo.listProducts({}), repo.listCollections()]);

  // Scope to this collection first, then apply the shopper's own filters.
  const scoped = productsInCollection(all, collection);

  const sortParam = typeof sp.sort === "string" ? sp.sort : "newest";
  const query: ProductQuery = {
    search: typeof sp.q === "string" ? sp.q : undefined,
    category: arr(sp.category),
    sizes: arr(sp.size),
    colors: arr(sp.color),
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    inStockOnly: sp.instock === "1",
    sort: (["newest", "price-asc", "price-desc", "popular"] as const).includes(sortParam as never)
      ? (sortParam as ProductQuery["sort"])
      : "newest",
  };

  const products = filterProducts(scoped, query);
  const facets = buildFacets(scoped);

  return (
    <>
      <PageHeader
        eyebrow={collection.kind === "category" ? t("shop.category") : t("nav.collections")}
        title={localized(collection, "name", locale)}
        subtitle={localized(collection, "description", locale)}
        crumbs={[
          { label: "MOSCOW", href: "/" },
          { label: t("nav.collections"), href: "/collections" },
          { label: localized(collection, "name", locale) },
        ]}
        tone="ice"
      />

      <div className="mw-container flex gap-10 py-10 sm:py-14">
        <ShopFilters facets={facets} collections={collections} total={products.length} />

        <div className="min-w-0 flex-1">
          <div className="mb-8 flex items-center justify-between gap-4">
            <p className="text-[13px] text-ice-600">
              <span className="font-medium tabular-nums text-ice-900">{products.length}</span>{" "}
              {products.length === 1 ? t("common.result") : t("common.results")}
            </p>
            <div className="flex items-center gap-2">
              <FilterTrigger />
              <SortSelect />
            </div>
          </div>

          <ProductGrid
            products={products}
            columns={3}
            priorityCount={3}
            emptyTitle={scoped.length === 0 ? t("common.comingSoon") : undefined}
            emptyHint={
              scoped.length === 0
                ? locale === "ar"
                  ? "هذه المجموعة لم تُملأ بعد. أضف منتجات إليها من لوحة التحكم."
                  : "This collection hasn't been filled yet. Add products to it from the admin dashboard."
                : undefined
            }
          />
        </div>
      </div>
    </>
  );
}
