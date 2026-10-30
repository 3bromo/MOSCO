"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, MapPin, Package, UserRound, LayoutDashboard } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

export default function AccountNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useUI((s) => s.toast);

  const items = [
    { href: "/account", label: t("account.overview"), icon: LayoutDashboard },
    { href: "/account/orders", label: t("account.orders"), icon: Package },
    { href: "/account/wishlist", label: t("account.wishlist"), icon: Heart },
    { href: "/account/addresses", label: t("account.addresses"), icon: MapPin },
    { href: "/account/profile", label: t("account.profile"), icon: UserRound },
  ];

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast(t("auth.logout"), "success");
    router.push("/");
    router.refresh();
  };

  return (
    <nav
      aria-label={t("account.title")}
      className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
    >
      {items.map((item) => {
        const active =
          item.href === "/account" ? pathname === "/account" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-[13.5px] transition-colors lg:rounded-md",
              active
                ? "bg-ice-900 text-white"
                : "bg-ice-50 text-ice-700 hover:bg-ice-100 hover:text-ice-900 lg:bg-transparent",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {item.label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={logout}
        className="flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-[13.5px] text-ice-600 transition-colors hover:bg-ice-100 hover:text-ice-900 lg:mt-2 lg:rounded-md lg:border-t lg:border-silver-200 lg:pt-4"
      >
        <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        {t("auth.logout")}
      </button>
    </nav>
  );
}
