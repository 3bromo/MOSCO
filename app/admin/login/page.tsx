import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import AuthForm from "@/components/account/AuthForm";
import { isAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — MOSCOW",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="mw-container flex min-h-[75vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ice-100">
            <ShieldCheck className="h-5 w-5 text-ice-800" strokeWidth={1.5} />
          </span>
          <p className="eyebrow mt-5">MOSCOW</p>
          <h1 className="mt-2 font-display text-2xl uppercase tracking-tight">Admin access</h1>
          <p className="mt-2 text-[13.5px] text-ice-600">
            Staff only. Sign in with your administrator account.
          </p>
        </div>
        <div className="rounded-lg border border-silver-200 bg-white p-7">
          <AuthForm mode="login" next="/admin" />
        </div>
      </div>
    </div>
  );
}
