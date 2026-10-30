import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/content/ContactForm";
import { WhatsAppIcon, InstagramIcon, TikTokIcon } from "@/components/ui/BrandIcons";
import PageHeader from "@/components/ui/PageHeader";
import Reveal from "@/components/motion/Reveal";
import { db } from "@/lib/db";
import { localized } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = "en";
  return {
    title: translate(locale, "page.contact"),
    description: "Reach the MOSCOW team by WhatsApp, email, or the message form.",
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const locale = "en";
  const t = (k: string) => translate(locale, k);
  const settings = await db().getSettings();

  const channels = [
    {
      icon: Mail,
      label: "Email us",
      value: settings.contact_email,
      href: `mailto:${settings.contact_email}`,
    },
    {
      icon: Phone,
      label: "Call us",
      value: settings.contact_phone,
      href: `tel:${settings.contact_phone.replace(/\s/g, "")}`,
    },
    {
      icon: MapPin,
      label: "Cairo, Egypt",
      value: localized(settings, "address_line", locale) || "Cairo, Egypt",
      href: null,
    },
  ];

  const socials = [
    settings.whatsapp && {
      icon: WhatsAppIcon,
      label: "WhatsApp",
      href: `https://wa.me/${settings.whatsapp.replace(/\\D/g, "")}`,
    },
    settings.instagram && {
      icon: InstagramIcon,
      label: "Instagram",
      href: `https://instagram.com/${settings.instagram.replace(/^@/, "")}`,
    },
    settings.tiktok && {
      icon: TikTokIcon,
      label: "TikTok",
      href: `https://tiktok.com/@${settings.tiktok.replace(/^@/, "")}`,
    },
  ].filter(Boolean) as {
    icon: typeof WhatsAppIcon;
    label: string;
    href: string;
  }[];

  return (
    <>
      <PageHeader
        eyebrow="MOSCOW"
        title={t("page.contact")}
        subtitle="A real team reads every message. We normally reply the same working day."
        crumbs={[{ label: "MOSCOW", href: "/" }, { label: t("page.contact") }]}
        tone="ice"
      />

      <div className="mw-container py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-20">
          <Reveal>
            <div className="rounded-lg border border-silver-200 bg-white p-6 sm:p-8">
              <h2 className="font-display text-xl uppercase tracking-tight">
                Send Message
              </h2>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="space-y-4">
              <ul className="space-y-3">
                {channels.map((c) => (
                  <li key={c.label}>
                    {c.href ? (
                      <a
                        href={c.href}
                        className="flex items-start gap-4 rounded-lg border border-silver-200 bg-white p-5 transition-colors hover:border-ice-400"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-ice-100 text-ice-700">
                          {c.icon as unknown as React.ReactNode}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] uppercase tracking-[0.12em] text-ice-500">{c.label}</span>
                          <span className="mt-1 block break-words text-[14px] text-ice-900">{c.value}</span>
                        </span>
                      </a>
                    ) : (
                      <div className="flex items-start gap-4 rounded-lg border border-silver-200 bg-white p-5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-ice-100 text-ice-700">
                          {c.icon as unknown as React.ReactNode}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] uppercase tracking-[0.12em] text-ice-500">{c.label}</span>
                          <span className="mt-1 block break-words text-[14px] text-ice-900">{c.value}</span>
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {socials.length > 0 && (
                <div className="rounded-lg bg-ice-50 p-5">
                  <p className="eyebrow">Follow</p>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {socials.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] text-ice-800 transition-colors hover:bg-ice-900 hover:text-white"
                      >
                        <s.icon className="h-4 w-4" />
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}
