import AdminHeader from "@/components/admin/AdminHeader";
import CollectionManager from "@/components/admin/CollectionManager";
import { db, productsInCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCollections() {
  const repo = db();
  const [collections, products] = await Promise.all([
    repo.listCollections({ includeHidden: true }),
    repo.listAllProducts(),
  ]);

  return (
    <>
      <AdminHeader
        title="Collections"
        subtitle="Categories drive the shop navigation. Curated collections are the storytelling groups on the homepage. New Arrivals, Best Sellers and Sale fill themselves from product badges."
      />
      <CollectionManager
        initial={collections.map((c) => ({
          ...c,
          count: productsInCollection(products, c).length,
        }))}
      />
    </>
  );
}
