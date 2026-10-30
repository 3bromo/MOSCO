import Link from "next/link";
import { Heart } from "lucide-react";
import ProductGrid from "@/components/product/ProductGrid";
import { requireCustomer } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function AccountWishlist() {
  const customer = await requireCustomer();
  const locale = await getLocale();
  const t = (k: string) => translate(locale, k);

  const all = await db().listProducts({});
  const products = all.filter((p) => customer.wishlist.includes(p.id));

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl uppercase tracking-tight">
        {t("account.wishlist")}
      </h1>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-silver-300 p-12 text-center">
          <Heart className="mx-auto h-8 w-8 text-ice-400" strokeWidth={1.25} />
          <p className="mt-4 text-[15px] font-medium">{t("account.emptyWishlist")}</p>
          <p className="mt-1.5 text-[13.5px] text-ice-600">{t("account.emptyWishlistHint")}</p>
          <Link href="/shop" className="btn btn-primary mt-6">
            {t("common.shopNow")}
          </Link>
        </div>
      ) : (
        <ProductGrid products={products} columns={3} />
      )}
    </div>
  );
}
