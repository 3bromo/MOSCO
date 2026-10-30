import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { db, totalStock } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  draft: "bg-amber-50 text-amber-800 ring-amber-200",
  archived: "bg-ice-100 text-ice-600 ring-ice-200",
};

export default async function AdminProducts() {
  const products = await db().listAllProducts();

  return (
    <>
      <AdminHeader
        title="Products"
        subtitle={`${products.length} in the catalogue. Prices, stock, images and per-product size charts are all edited here.`}
        action={
          <Link href="/admin/products/new" className="btn btn-primary !py-2.5 !text-[13px]">
            <Plus className="h-4 w-4" strokeWidth={2} />
            New product
          </Link>
        }
      />

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-silver-300 p-12 text-center">
          <p className="text-[14px] text-ice-600">No products yet.</p>
          <Link href="/admin/products/new" className="btn btn-primary mt-5">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-silver-200 bg-white">
          <ul className="divide-y divide-silver-200">
            {products.map((p) => {
              const stock = totalStock(p);
              const soldOutSizes = p.sizes.filter((s) => s.stock <= 0).length;

              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex flex-wrap items-center gap-x-5 gap-y-3 p-4 transition-colors hover:bg-ice-50/70"
                  >
                    <div className="relative aspect-3/4 w-12 shrink-0 overflow-hidden rounded bg-ice-100">
                      {p.images[0] && (
                        <Image
                          src={p.images[0].url}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-[180px] flex-1">
                      <p className="text-[14px] font-medium leading-snug">{p.name}</p>
                      <p className="mt-0.5 font-mono text-[11.5px] text-ice-500">
                        {p.sku} · /{p.slug}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10.5px] uppercase tracking-[0.08em] ring-1 ring-inset",
                        STATUS_TONE[p.status],
                      )}
                    >
                      {p.status}
                    </span>

                    <span className="hidden text-[12.5px] text-ice-600 sm:inline">
                      {p.category}
                    </span>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[12.5px] tabular-nums",
                        stock === 0 ? "text-red-600" : stock <= 8 ? "text-amber-700" : "text-ice-600",
                      )}
                      title={`${soldOutSizes} of ${p.sizes.length} sizes sold out`}
                    >
                      {stock === 0 && <AlertTriangle className="h-3 w-3" strokeWidth={2} />}
                      {stock} in stock
                    </span>

                    <span className="w-24 text-end text-[14px] font-medium tabular-nums">
                      {formatMoney(p.price, "en")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
