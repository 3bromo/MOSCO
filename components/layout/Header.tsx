"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import type { Collection, Settings } from "@/lib/db/types";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import LocaleSwitch from "./LocaleSwitch";
import MobileNav from "./MobileNav";

export default function Header({
  collections,
  settings,
  signedIn,
}: {
  collections: Collection[];
  settings: Settings;
  signedIn: boolean;
}) {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);

  const cartCount = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const cartHydrated = useCart((s) => s.hydrated);
  const wishCount = useWishlist((s) => s.ids.length);
  const wishHydrated = useWishlist((s) => s.hydrated);
  const setCartOpen = useCart((s) => s.setOpen);
  const { setSearchOpen, setMenuOpen } = useUI();

  // Only the homepage has a dark cinematic hero to sit on top of.
  const overHero = pathname === "/";
  const solid = scrolled || !overHero || megaOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMegaOpen(false), [pathname]);

  const announcement = settings.banners?.find(
    (b) => b.placement === "announcement" && b.visible,
  );

  const categories = collections.filter((c) => c.kind === "category" && c.visible);
  const edits = collections.filter((c) => c.kind === "collection" && c.visible);

  // The homepage hero is a bright arctic scene, so header ink stays dark in
  // both states — only the surface behind it changes.
  const navLink =
    "relative py-2 text-[12px] font-medium uppercase tracking-[0.16em] text-ice-900/75 transition-colors duration-300 hover:text-ice-900";

  const iconBtn = cn(
    "relative grid h-10 w-10 place-items-center rounded-full text-ice-900 transition-all duration-300",
    solid ? "hover:bg-ice-100" : "hover:bg-white/55",
  );

  return (
    <>
      {announcement && (
        <div className="relative z-50 bg-ice-900 text-white">
          <div className="mw-container flex min-h-9 items-center justify-center py-2 text-center text-[11px] font-medium tracking-[0.12em] uppercase">
            {localized(announcement, "title", locale)}
          </div>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-500",
          solid
            ? "border-b border-silver-200/80 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70"
            : "border-b border-transparent bg-transparent",
        )}
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="mw-container flex h-[var(--header-h)] items-center justify-between gap-4">
          {/* left — mobile menu + primary nav */}
          <div className="flex flex-1 items-center gap-1 lg:gap-7">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={cn(iconBtn, "lg:hidden -ms-2")}
              aria-label={t("nav.menu")}
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>

            <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
              <Link href="/shop" className={navLink}>
                {t("nav.shop")}
              </Link>
              <Link href="/collections/new-arrivals" className={navLink}>
                {t("nav.newArrivals")}
              </Link>
              <button
                type="button"
                className={cn(navLink, "flex items-center gap-1.5")}
                onMouseEnter={() => setMegaOpen(true)}
                onFocus={() => setMegaOpen(true)}
                onClick={() => setMegaOpen((v) => !v)}
                aria-expanded={megaOpen}
                aria-haspopup="true"
              >
                {t("nav.collections")}
                <span
                  className={cn(
                    "block h-1 w-1 rounded-full bg-current transition-opacity duration-300",
                    megaOpen ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
              <Link href="/about" className={navLink}>
                {t("nav.about")}
              </Link>
            </nav>
          </div>

          {/* centre — wordmark */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-ice-900 transition-colors duration-300 rtl:translate-x-1/2"
            aria-label="MOSCOW — home"
          >
            <Logo size="md" />
          </Link>

          {/* right — utilities */}
          <div className="flex flex-1 items-center justify-end gap-0.5">
            <LocaleSwitch solid={solid} />

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={iconBtn}
              aria-label={t("nav.search")}
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>

            <Link
              href={signedIn ? "/account" : "/account/login"}
              className={cn(iconBtn, "hidden sm:grid")}
              aria-label={t("nav.account")}
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>

            <Link href="/wishlist" className={cn(iconBtn, "hidden sm:grid")} aria-label={t("nav.wishlist")}>
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {wishHydrated && wishCount > 0 && <Badge solid={solid}>{wishCount}</Badge>}
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className={cn(iconBtn, "-me-2")}
              aria-label={`${t("nav.cart")} (${cartCount})`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {cartHydrated && cartCount > 0 && <Badge solid={solid}>{cartCount}</Badge>}
            </button>
          </div>
        </div>

        {/* mega menu */}
        <div
          className={cn(
            "absolute inset-x-0 top-full overflow-hidden border-b border-silver-200 bg-white/95 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
            megaOpen ? "max-h-[460px] opacity-100" : "pointer-events-none max-h-0 opacity-0",
          )}
          onMouseEnter={() => setMegaOpen(true)}
        >
          <div className="mw-container grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="eyebrow mb-4">{t("shop.category")}</p>
              <ul className="space-y-2.5">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/collections/${c.slug}`}
                      className="link-underline text-[15px] text-ice-900/80 hover:text-ice-900"
                    >
                      {localized(c, "name", locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="eyebrow mb-4">{t("nav.collections")}</p>
              <ul className="space-y-2.5">
                {edits.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/collections/${c.slug}`}
                      className="link-underline text-[15px] text-ice-900/80 hover:text-ice-900"
                    >
                      {localized(c, "name", locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="eyebrow mb-4">{t("nav.help")}</p>
              <ul className="space-y-2.5">
                {[
                  ["/track", t("nav.track")],
                  ["/shipping", t("footer.shippingInfo")],
                  ["/returns", t("footer.returns")],
                  ["/faq", t("footer.faq")],
                  ["/contact", t("nav.contact")],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="link-underline text-[15px] text-ice-900/80 hover:text-ice-900"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/collections/new-arrivals"
              className="group relative hidden overflow-hidden rounded-lg bg-ice-100 lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-ice-900/70 via-ice-900/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="eyebrow !text-white/70">{t("home.featured")}</p>
                <p className="mt-1 font-display text-xl uppercase tracking-tight">
                  {t("nav.newArrivals")}
                </p>
              </div>
              {/* decorative frost panel */}
              <div className="aspect-4/3 w-full bg-[radial-gradient(120%_90%_at_30%_10%,#dceeff_0%,#9cc9ec_55%,#3f6991_100%)] transition-transform duration-700 group-hover:scale-105" />
            </Link>
          </div>
        </div>
      </header>

      <MobileNav collections={collections} signedIn={signedIn} />
    </>
  );
}

function Badge({ children, solid }: { children: React.ReactNode; solid: boolean }) {
  return (
    <span
      className={cn(
        "absolute end-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums ring-1",
        solid ? "bg-ice-900 text-white ring-transparent" : "bg-ice-900 text-white ring-white/60",
      )}
    >
      {children}
    </span>
  );
}
