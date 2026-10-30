import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/product/ProductGallery";
import ProductGrid from "@/components/product/ProductGrid";
import ProductPurchase from "@/components/product/ProductPurchase";
import SectionHeader from "@/components/ui/SectionHeader";
import { db } from "@/lib/db";
import { totalStock } from "@/lib/db/types";
import { localized } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://moscow.store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await db().getProductBySlug(slug);
  const locale = await getLocale();
  if (!product) return { title: translate(locale, "notFound.title") };

  const name = localized(product, "name", locale);
  const description =
    product.seo_description || localized(product, "description", locale).slice(0, 160);

  return {
    title: product.seo_title || name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: name,
      description,
      url: `${SITE_URL}/product/${product.slug}`,
      images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = (k: string) => translate(locale, k);
  const repo = db();

  const product = await repo.getProductBySlug(slug);
  if (!product || product.status === "archived") notFound();

  const [settings, catalogue] = await Promise.all([repo.getSettings(), repo.listProducts({})]);

  // Related: same category first, then anything else from the house.
  const related = [
    ...catalogue.filter((p) => p.id !== product.id && p.category === product.category),
    ...catalogue.filter((p) => p.id !== product.id && p.category !== product.category),
  ].slice(0, 4);

  const inStock = totalStock(product) > 0;

  const shippingNote =
    locale === "ar"
      ? `الشحن داخل مصر يبدأ من ${settings.shipping_flat} ج.م، ومجاني للطلبات فوق ${settings.free_shipping_threshold} ج.م. التوصيل عادة من ٢ إلى ٥ أيام عمل. الاستبدال أو الإرجاع متاح خلال ١٤ يوماً من الاستلام طالما القطعة بحالتها الأصلية.`
      : `Shipping inside Egypt starts at ${settings.shipping_flat} EGP and is free over ${settings.free_shipping_threshold} EGP. Delivery usually takes 2–5 working days. Exchanges and returns are accepted within 14 days of delivery while the piece is in its original condition.`;

  // Structured data so the product surfaces properly in search.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => `${SITE_URL}${i.url}`),
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: settings.brand_name },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "EGP",
      price: product.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mw-container pt-6 sm:pt-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-[12px] text-ice-500">
            <li>
              <a href="/" className="hover:text-ice-900">
                MOSCOW
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <a href="/shop" className="hover:text-ice-900">
                {t("shop.title")}
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <a href={`/collections/${product.category}`} className="hover:text-ice-900">
                {product.category.replace(/-/g, " ")}
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ice-800">{localized(product, "name", locale)}</li>
          </ol>
        </nav>
      </div>

      <article className="mw-container grid gap-10 py-8 lg:grid-cols-2 lg:gap-16 lg:py-12">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+20px)] lg:self-start">
          <ProductGallery
            images={product.images}
            productName={localized(product, "name", locale)}
          />
        </div>

        <ProductPurchase
          product={product}
          fitSettings={settings.fit_ai}
          shippingNote={shippingNote}
        />
      </article>

      {related.length > 0 && (
        <section className="mw-container border-t border-silver-200 py-16 sm:py-20">
          <SectionHeader title={t("product.related")} href="/shop" hrefLabel={t("common.viewAll")} />
          <ProductGrid products={related} columns={4} />
        </section>
      )}
    </>
  );
}
