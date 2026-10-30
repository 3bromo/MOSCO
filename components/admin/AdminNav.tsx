"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Percent,
  Settings,
  Shirt,
  Store,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Shirt },
  { href: "/admin/collections", label: "Collections", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/discounts", label: "Discounts", icon: Percent },
  { href: "/admin/content", label: "Homepage", icon: ImageIcon },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <nav
      aria-label="Admin"
      className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0"
    >
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2.5 text-[13px] transition-colors lg:rounded-md",
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

      <div className="hidden lg:mt-3 lg:block lg:border-t lg:border-silver-200 lg:pt-3" />

      <Link
        href="/"
        className="flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2.5 text-[13px] text-ice-600 transition-colors hover:bg-ice-100 hover:text-ice-900 lg:rounded-md"
      >
        <Store className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        View store
      </Link>
      <button
        type="button"
        onClick={logout}
        className="flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2.5 text-[13px] text-ice-600 transition-colors hover:bg-ice-100 hover:text-ice-900 lg:rounded-md"
      >
        <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        Sign out
      </button>
    </nav>
  );
}
