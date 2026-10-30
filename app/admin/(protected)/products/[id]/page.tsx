import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ProductEditor from "@/components/admin/ProductEditor";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = db();

  const [product, collections, settings] = await Promise.all([
    repo.getProductById(id),
    repo.listCollections({ includeHidden: true }),
    repo.getSettings(),
  ]);

  if (!product) notFound();

  return (
    <>
      <AdminHeader
        title={product.name}
        subtitle={`${product.sku} · last updated ${new Date(product.updated_at).toLocaleString("en-GB")}`}
        back={{ href: "/admin/products", label: "Products" }}
        action={
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            className="btn btn-ghost !py-2.5 !text-[13px]"
          >
            View live
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.6} />
          </Link>
        }
      />
      <ProductEditor
        product={product}
        collections={collections.map((c) => ({ slug: c.slug, name: c.name, kind: c.kind }))}
        fitEnabled={settings.fit_ai.enabled}
      />
    </>
  );
}
