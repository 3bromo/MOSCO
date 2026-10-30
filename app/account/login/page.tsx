import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/account/AuthForm";
import { getSession } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "auth.loginTitle"), robots: { index: false } };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (await getSession()) redirect(next && next.startsWith("/") ? next : "/account");

  const locale = await getLocale();

  return (
    <div className="mw-container flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="eyebrow">MOSCOW</p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-tight">
            {translate(locale, "auth.loginTitle")}
          </h1>
          <p className="mt-2 text-[14px] text-ice-600">{translate(locale, "auth.loginSub")}</p>
        </div>
        <div className="rounded-lg border border-silver-200 bg-white p-7">
          <AuthForm mode="login" next={next && next.startsWith("/") ? next : undefined} />
        </div>
      </div>
    </div>
  );
}
