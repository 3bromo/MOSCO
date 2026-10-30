import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth/guards";
import { dbMode } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin — MOSCOW", template: "%s — MOSCOW Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="mw-container py-8 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[216px_1fr] lg:gap-12">
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+20px)] lg:self-start">
          <div className="mb-5 hidden lg:block">
            <p className="eyebrow">MOSCOW</p>
            <p className="mt-1 font-display text-lg uppercase tracking-tight">Dashboard</p>
            <p className="mt-1.5 truncate text-[12px] text-ice-500">{admin.email}</p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ice-100 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.1em] text-ice-700"
              title={
                dbMode() === "supabase"
                  ? "Writing to your Supabase project"
                  : "Writing to the local JSON database (data/mosco.json). Add Supabase keys to switch."
              }
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  dbMode() === "supabase" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {dbMode() === "supabase" ? "Supabase" : "Local DB"}
            </span>
          </div>
          <AdminNav />
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
