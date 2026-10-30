import AdminHeader from "@/components/admin/AdminHeader";
import ProductEditor from "@/components/admin/ProductEditor";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [collections, settings] = await Promise.all([
    db().listCollections({ includeHidden: true }),
    db().getSettings(),
  ]);

  return (
    <>
      <AdminHeader
        title="New product"
        subtitle="Upload the real photographs, then fill in this product's own measurement chart so Fit AI has something accurate to work from."
        back={{ href: "/admin/products", label: "Products" }}
      />
      <ProductEditor
        product={null}
        collections={collections.map((c) => ({ slug: c.slug, name: c.name, kind: c.kind }))}
        fitEnabled={settings.fit_ai.enabled}
      />
    </>
  );
}
