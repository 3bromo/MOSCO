import AdminHeader from "@/components/admin/AdminHeader";
import ContentEditor from "@/components/admin/ContentEditor";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminContent() {
  const settings = await db().getSettings();

  return (
    <>
      <AdminHeader
        title="Homepage & banners"
        subtitle="The editorial copy and imagery shown on the storefront. Everything here is stored in the database, not hard-coded."
      />
      <ContentEditor settings={settings} />
    </>
  );
}
