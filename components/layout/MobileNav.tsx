"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Heart, Package, User, X } from "lucide-react";
import type { Collection } from "@/lib/db/types";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import Logo from "./Logo";

export default function MobileNav({
  collections,
  signedIn,
}: {
  collections: Collection[];
  signedIn: boolean;
}) {
  const { t, locale } = useI18n();
  const { menuOpen, setMenuOpen } = useUI();
  const pathname = usePathname();

  useEffect(() => setMenuOpen(false), [pathname, setMenuOpen]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, setMenuOpen]);

  const categories = collections.filter((c) => c.kind === "category");
  const edits = collections.filter((c) => c.kind === "collection");

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-ice-950/30 backdrop-blur-sm transition-opacity duration-400 lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.menu")}
      >
        <div className="flex items-center justify-between border-b border-silver-200 px-5 py-4">
          <Logo size="sm" className="text-ice-900" />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-full text-ice-900 hover:bg-ice-100"
            aria-label={t("nav.close")}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">
          <Link
            href="/shop"
            className="flex items-center justify-between border-b border-silver-200 py-4 font-display text-2xl uppercase tracking-tight text-ice-900"
          >
            {t("nav.shop")}
            <ArrowRight className="h-5 w-5 rtl:rotate-180" strokeWidth={1.5} />
          </Link>

          <p className="eyebrow mt-7 mb-3">{t("nav.collections")}</p>
          <ul className="space-y-1">
            {edits.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="block rounded-md py-2.5 text-[15px] text-ice-800 active:bg-ice-50"
                >
                  {localized(c, "name", locale)}
                </Link>
              </li>
            ))}
          </ul>

          <p className="eyebrow mt-7 mb-3">{t("shop.category")}</p>
          <ul className="space-y-1">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="block rounded-md py-2.5 text-[15px] text-ice-800 active:bg-ice-50"
                >
                  {localized(c, "name", locale)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hairline my-7" />

          <ul className="space-y-1">
            {[
              ["/about", t("nav.about")],
              ["/contact", t("nav.contact")],
              ["/faq", t("footer.faq")],
              ["/shipping", t("footer.shippingInfo")],
              ["/returns", t("footer.returns")],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="block rounded-md py-2.5 text-[15px] text-ice-700">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid grid-cols-3 gap-px border-t border-silver-200 bg-silver-200">
          <QuickLink href={signedIn ? "/account" : "/account/login"} label={t("nav.account")}>
            <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </QuickLink>
          <QuickLink href="/wishlist" label={t("nav.wishlist")}>
            <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </QuickLink>
          <QuickLink href="/track" label={t("nav.track")}>
            <Package className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </QuickLink>
        </div>
      </aside>
    </>
  );
}

function QuickLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 bg-white py-4 text-[10px] font-medium uppercase tracking-[0.12em] text-ice-700 active:bg-ice-50"
    >
      {children}
      {label}
    </Link>
  );
}
