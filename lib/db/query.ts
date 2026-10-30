import type { Collection, Product, ProductQuery } from "./types";
import { totalStock } from "./types";

/**
 * Shared, adapter-independent filtering so the local file store and Supabase
 * return byte-identical results for the same query.
 */
export function filterProducts(all: Product[], q: ProductQuery = {}): Product[] {
  let out = all;

  if (!q.includeDrafts) out = out.filter((p) => p.status === "active");

  if (q.search?.trim()) {
    const terms = q.search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    out = out.filter((p) => {
      const hay = [
        p.name,
        p.name_ar ?? "",
        p.subtitle ?? "",
        p.description,
        p.description_ar ?? "",
        p.sku,
        p.category,
        ...p.collections,
        ...p.colors.map((c) => `${c.name} ${c.name_ar ?? ""}`),
      ]
        .join(" ")
        .toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  const cats = toArray(q.category);
  if (cats.length) out = out.filter((p) => cats.includes(p.category));

  const cols = toArray(q.collection);
  if (cols.length) out = out.filter((p) => cols.some((c) => p.collections.includes(c)));

  if (q.sizes?.length) {
    out = out.filter((p) => p.sizes.some((s) => q.sizes!.includes(s.size) && s.stock > 0));
  }

  if (q.colors?.length) {
    const want = q.colors.map((c) => c.toLowerCase());
    out = out.filter((p) => p.colors.some((c) => want.includes(c.name.toLowerCase())));
  }

  if (typeof q.minPrice === "number") out = out.filter((p) => p.price >= q.minPrice!);
  if (typeof q.maxPrice === "number") out = out.filter((p) => p.price <= q.maxPrice!);

  if (q.inStockOnly) out = out.filter((p) => totalStock(p) > 0);

  out = [...out].sort((a, b) => {
    switch (q.sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "popular":
        return b.popularity - a.popularity || b.sold_count - a.sold_count;
      case "newest":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ||
          a.name.localeCompare(b.name)
        );
    }
  });

  const offset = q.offset ?? 0;
  const limit = q.limit ?? out.length;
  return out.slice(offset, offset + limit);
}

function toArray(v?: string | string[]): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v.filter(Boolean) : [v].filter(Boolean);
}

/**
 * A product belongs to a collection either explicitly (collections[]) or
 * implicitly via the collection's auto_badge rule.
 */
export function productsInCollection(products: Product[], collection: Collection): Product[] {
  return products.filter((p) => {
    if (p.status !== "active") return false;
    if (p.collections.includes(collection.slug)) return true;
    if (collection.kind === "category" && p.category === collection.slug) return true;
    if (collection.auto_badge && p.badges.includes(collection.auto_badge)) return true;
    return false;
  });
}

/** Facet values derived from the live catalogue — never hard-coded. */
export function buildFacets(products: Product[]) {
  const sizes = new Map<string, number>();
  const colors = new Map<string, { name: string; hex: string; count: number }>();
  const categories = new Map<string, number>();
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  for (const p of products) {
    if (p.status !== "active") continue;
    min = Math.min(min, p.price);
    max = Math.max(max, p.price);
    categories.set(p.category, (categories.get(p.category) ?? 0) + 1);
    for (const s of p.sizes) sizes.set(s.size, (sizes.get(s.size) ?? 0) + (s.stock > 0 ? 1 : 0));
    for (const c of p.colors) {
      const cur = colors.get(c.name) ?? { name: c.name, hex: c.hex, count: 0 };
      cur.count += 1;
      colors.set(c.name, cur);
    }
  }

  return {
    sizes: [...sizes.keys()].sort(sizeSort),
    colors: [...colors.values()],
    categories: [...categories.entries()].map(([slug, count]) => ({ slug, count })),
    minPrice: Number.isFinite(min) ? Math.floor(min / 100) * 100 : 0,
    maxPrice: max ? Math.ceil(max / 100) * 100 : 10000,
  };
}

const LETTER_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

/** Sorts XS < S < M < L < XL and numeric waists numerically. */
export function sizeSort(a: string, b: string): number {
  const ia = LETTER_ORDER.indexOf(a.toUpperCase());
  const ib = LETTER_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b);
}
