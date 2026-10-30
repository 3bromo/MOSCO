import type { Metadata } from "next";
import TrackForm from "@/components/order/TrackForm";
import PageHeader from "@/components/ui/PageHeader";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "track.title"),
    description: translate(locale, "track.sub"),
    alternates: { canonical: "/track" },
  };
}

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const locale = await getLocale();

  return (
    <>
      <PageHeader
        eyebrow="MOSCOW"
        title={translate(locale, "track.title")}
        subtitle={translate(locale, "track.sub")}
        crumbs={[{ label: "MOSCOW", href: "/" }, { label: translate(locale, "track.title") }]}
        tone="ice"
      />
      <div className="mw-container py-12 sm:py-16">
        <TrackForm initialOrder={order ?? ""} />
      </div>
    </>
  );
}
