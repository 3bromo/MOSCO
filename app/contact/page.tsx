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

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "page.contact"),
    description:
      locale === "ar"
        ? "تواصل مع فريق موسكو — واتساب، بريد إلكتروني، أو نموذج المراسلة."
        : "Reach the MOSCOW team by WhatsApp, email, or the message form.",
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const t = (k: string) => translate(locale, k);
  const settings = await db().getSettings();

  const channels = [
    {
      icon: Mail,
      label: t("contact.emailUs"),
      value: settings.contact_email,
      href: `mailto:${settings.contact_email}`,
    },
    {
      icon: Phone,
      label: t("contact.callUs"),
      value: settings.contact_phone,
      href: `tel:${settings.contact_phone.replace(/\s/g, "")}`,
    },
    {
      icon: Clock,
      label: t("contact.hours"),
      value: locale === "ar" ? "السبت – الخميس، ١٠ص – ٧م" : "Sat – Thu, 10:00 – 19:00",
      href: null,
    },
    {
      icon: MapPin,
      label: t("footer.house"),
      value: localized(settings, "address_line", locale) || "Cairo, Egypt",
      href: null,
    },
  ];

  const socials = [
    settings.whatsapp && {
      icon: WhatsAppIcon,
      label: "WhatsApp",
      href: `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`,
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
  ].filter(Boolean) as { icon: typeof WhatsAppIcon; label: string; href: string }[];

  return (
    <>
      <PageHeader
        eyebrow="MOSCOW"
        title={t("page.contact")}
        subtitle={
          locale === "ar"
            ? "فريق حقيقي يقرأ كل رسالة. عادةً نردّ في نفس يوم العمل."
            : "A real team reads every message. We normally reply the same working day."
        }
        crumbs={[{ label: "MOSCOW", href: "/" }, { label: t("page.contact") }]}
        tone="ice"
      />

      <div className="mw-container py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-20">
          <Reveal>
            <div className="rounded-lg border border-silver-200 bg-white p-6 sm:p-8">
              <h2 className="font-display text-xl uppercase tracking-tight">
                {t("contact.send")}
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
                        <ChannelBody icon={c.icon} label={c.label} value={c.value} />
                      </a>
                    ) : (
                      <div className="flex items-start gap-4 rounded-lg border border-silver-200 bg-white p-5">
                        <ChannelBody icon={c.icon} label={c.label} value={c.value} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {socials.length > 0 && (
                <div className="rounded-lg bg-ice-50 p-5">
                  <p className="eyebrow">{t("footer.follow")}</p>
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

function ChannelBody({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ice-100 text-ice-700">
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] uppercase tracking-[0.12em] text-ice-500">{label}</span>
        <span className="mt-1 block break-words text-[14px] text-ice-900">{value}</span>
      </span>
    </>
  );
}
