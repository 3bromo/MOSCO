import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/noto-kufi-arabic";
import "./globals.css";

import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import SearchOverlay from "@/components/layout/SearchOverlay";
import MotionProvider from "@/components/motion/MotionProvider";
import Toaster from "@/components/ui/Toaster";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { dirOf } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/i18n/context";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://moscow.store";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await db().getSettings();
  const locale = await getLocale();
  const title = `${settings.brand_name} — ${
    locale === "ar" ? settings.tagline_ar || settings.tagline : settings.tagline
  }`;
  const description =
    locale === "ar"
      ? settings.about_body_ar || settings.about_body || settings.tagline
      : settings.about_body || settings.tagline;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s — ${settings.brand_name}` },
    description,
    applicationName: settings.brand_name,
    keywords: [
      "MOSCOW",
      "streetwear",
      "denim",
      "monogram denim",
      "premium streetwear Egypt",
      "ستريت وير",
      "دينيم",
    ],
    openGraph: {
      type: "website",
      siteName: settings.brand_name,
      title,
      description,
      url: SITE_URL,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      images: [{ url: "/products/monogram-denim-set-full.jpeg", width: 1170, height: 1177 }],
    },
    twitter: { card: "summary_large_image", title, description },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/icon.svg" }],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#f6fbff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const session = await getSession();
  const repo = db();
  const [settings, collections] = await Promise.all([
    repo.getSettings(),
    repo.listCollections(),
  ]);

  return (
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <I18nProvider locale={locale}>
          <MotionProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ice-900 focus:px-5 focus:py-2.5 focus:text-sm focus:text-white"
            >
              {translate(locale, "common.skipToContent")}
            </a>

            <Header
              collections={collections}
              settings={settings}
              signedIn={Boolean(session)}
            />

            <main id="main">{children}</main>

            <Footer collections={collections} settings={settings} />

            <CartDrawer freeShippingThreshold={settings.free_shipping_threshold} />
            <SearchOverlay />
            <Toaster />
          </MotionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
