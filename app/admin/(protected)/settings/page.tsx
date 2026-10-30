import AdminHeader from "@/components/admin/AdminHeader";
import SettingsEditor from "@/components/admin/SettingsEditor";
import { db, dbMode } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const settings = await db().getSettings();

  return (
    <>
      <AdminHeader
        title="Settings"
        subtitle="Store details, shipping rates, payment instructions and Fit AI behaviour."
      />
      <SettingsEditor settings={settings} mode={dbMode()} />
    </>
  );
}
