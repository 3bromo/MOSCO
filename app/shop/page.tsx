import type { Metadata } from "next";
import ProductGrid from "@/components/product/ProductGrid";
import FilterTrigger from "@/components/shop/FilterTrigger";
import ShopFilters from "@/components/shop/ShopFilters";
import SortSelect from "@/components/shop/SortSelect";
import PageHeader from "@/components/ui/PageHeader";
import { buildFacets, db } from "@/lib/db";
import type { ProductQuery } from "@/lib/db/types";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "shop.title"),
    description: translate(locale, "shop.sub"),
    alternates: { canonical: "/shop" },
  };
}

type SP = Record<string, string | string[] | undefined>;

function arr(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = (k: string, vars?: Record<string, string | number>) => translate(locale, k, vars);
  const repo = db();

  const sortParam = typeof sp.sort === "string" ? sp.sort : "newest";
  const query: ProductQuery = {
    search: typeof sp.q === "string" ? sp.q : undefined,
    category: arr(sp.category),
    collection: arr(sp.collection),
    sizes: arr(sp.size),
    colors: arr(sp.color),
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    inStockOnly: sp.instock === "1",
    sort: (["newest", "price-asc", "price-desc", "popular"] as const).includes(
      sortParam as never,
    )
      ? (sortParam as ProductQuery["sort"])
      : "newest",
  };

  const [products, all, collections] = await Promise.all([
    repo.listProducts(query),
    repo.listProducts({}),
    repo.listCollections(),
  ]);

  const facets = buildFacets(all);
  const searchTerm = typeof sp.q === "string" ? sp.q : "";

  return (
    <>
      <PageHeader
        eyebrow={t("nav.shop")}
        title={searchTerm ? `“${searchTerm}”` : t("shop.title")}
        subtitle={searchTerm ? undefined : t("shop.sub")}
        crumbs={[
          { label: "MOSCOW", href: "/" },
          { label: t("shop.title") },
        ]}
        tone="ice"
      />

      <div className="mw-container flex gap-10 py-10 sm:py-14">
        <ShopFilters facets={facets} collections={collections} total={products.length} />

        <div className="min-w-0 flex-1">
          <div className="mb-8 flex items-center justify-between gap-4">
            <p className="text-[13px] text-ice-600">
              <span className="font-medium text-ice-900 tabular-nums">{products.length}</span>{" "}
              {products.length === 1 ? t("common.result") : t("common.results")}
            </p>
            <div className="flex items-center gap-2">
              <FilterTrigger />
              <SortSelect />
            </div>
          </div>

          <ProductGrid products={products} columns={3} priorityCount={3} />
        </div>
      </div>
    </>
  );
}
