"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";
import type { Collection, Settings } from "@/lib/db/types";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { isValidEmail } from "@/lib/utils";
import Logo from "./Logo";

export default function Footer({
  collections,
  settings,
}: {
  collections: Collection[];
  settings: Settings;
}) {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setState("err");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "ok" : "err");
      if (res.ok) setEmail("");
    } catch {
      setState("err");
    }
  }

  const shopLinks = collections.filter((c) => c.visible).slice(0, 6);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-silver-200 bg-white">
      {/* newsletter */}
      <section className="border-b border-silver-200 bg-gradient-to-b from-ice-50 to-white">
        <div className="mw-container grid gap-8 py-16 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <p className="eyebrow">{t("footer.follow")}</p>
            <h2 className="display-md mt-3 uppercase">{t("home.newsletterTitle")}</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ice-700">
              {t("home.newsletterSub")}
            </p>
          </div>

          <form onSubmit={subscribe} className="md:justify-self-end md:w-full md:max-w-md">
            <div className="flex items-center gap-2 rounded-full border border-silver-300 bg-white p-1.5 focus-within:border-ice-500">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state !== "idle") setState("idle");
                }}
                placeholder={t("home.newsletterPlaceholder")}
                aria-label={t("home.newsletterPlaceholder")}
                className="min-w-0 flex-1 bg-transparent px-4 py-2 outline-none"
                style={{ fontSize: 16 }}
              />
              <button
                type="submit"
                disabled={state === "sending"}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ice-900 text-white transition-transform hover:scale-105 disabled:opacity-50"
                aria-label={t("home.newsletterCta")}
              >
                <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.75} />
              </button>
            </div>
            {state === "ok" && (
              <p className="mt-2.5 ps-2 text-[13px] text-ice-700">{t("home.newsletterOk")}</p>
            )}
            {state === "err" && (
              <p className="mt-2.5 ps-2 text-[13px] text-red-600">{t("home.newsletterErr")}</p>
            )}
          </form>
        </div>
      </section>

      {/* link columns */}
      <div className="mw-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo size="lg" className="text-ice-900" />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ice-600">
            {localized(settings, "tagline", locale)}
          </p>
          <p className="mt-6 text-[12px] tracking-wide text-ice-500">{t("footer.madeIn")}</p>
          <div className="mt-5 flex items-center gap-2">
            {settings.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full border border-silver-300 text-ice-700 transition-colors hover:border-ice-900 hover:text-ice-900"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            )}
            {settings.tiktok && (
              <a
                href={`https://tiktok.com/@${settings.tiktok}`}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="TikTok"
                className="grid h-9 w-9 place-items-center rounded-full border border-silver-300 text-ice-700 transition-colors hover:border-ice-900 hover:text-ice-900"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
            )}
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="WhatsApp"
                className="grid h-9 w-9 place-items-center rounded-full border border-silver-300 text-ice-700 transition-colors hover:border-ice-900 hover:text-ice-900"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <nav aria-label={t("footer.shop")}>
          <h3 className="eyebrow mb-4">{t("footer.shop")}</h3>
          <ul className="space-y-2.5">
            <li>
              <Link href="/shop" className="text-[14px] text-ice-700 hover:text-ice-900">
                {t("shop.title")}
              </Link>
            </li>
            {shopLinks.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="text-[14px] text-ice-700 hover:text-ice-900"
                >
                  {localized(c, "name", locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("footer.help")}>
          <h3 className="eyebrow mb-4">{t("footer.help")}</h3>
          <ul className="space-y-2.5">
            {[
              ["/track", t("nav.track")],
              ["/shipping", t("footer.shippingInfo")],
              ["/returns", t("footer.returns")],
              ["/faq", t("footer.faq")],
              ["/contact", t("nav.contact")],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-[14px] text-ice-700 hover:text-ice-900">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("footer.house")}>
          <h3 className="eyebrow mb-4">{t("footer.house")}</h3>
          <ul className="space-y-2.5">
            {[
              ["/about", t("nav.about")],
              ["/account", t("nav.account")],
              ["/wishlist", t("nav.wishlist")],
              ["/privacy", t("footer.privacy")],
              ["/terms", t("footer.terms")],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-[14px] text-ice-700 hover:text-ice-900">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-silver-200">
        <div className="mw-container flex flex-col items-center justify-between gap-3 py-6 text-[12px] text-ice-500 sm:flex-row">
          <p>
            © {year} {settings.brand_name}. {t("footer.rights")}
          </p>
          <p className="tracking-wide">{t("footer.payments")}</p>
        </div>
      </div>
    </footer>
  );
}
