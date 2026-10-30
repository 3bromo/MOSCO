"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import Reveal from "@/components/motion/Reveal";

export default function StoryBlock({
  title,
  body,
  image,
}: {
  title: string;
  body: string;
  image?: string | null;
}) {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-ice-900 text-white">
      {/* frost texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(90% 60% at 15% 0%,rgba(156,201,236,.55) 0%,transparent 60%),radial-gradient(70% 60% at 100% 100%,rgba(220,238,255,.35) 0%,transparent 65%)",
        }}
      />

      <div className="mw-container relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
        <Reveal>
          <p className="eyebrow !text-ice-300">{t("home.storyEyebrow")}</p>
          <h2 className="display-lg mt-4 text-white">{title}</h2>
          <p className="mt-6 max-w-lg text-[16px] leading-[1.8] text-ice-200">{body}</p>
          <Link
            href="/about"
            className="btn mt-9 bg-white text-ice-900 hover:bg-ice-100"
          >
            {t("common.learnMore")}
          </Link>
        </Reveal>

        {image && (
          <Reveal delay={0.12} className="relative">
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-lg sm:aspect-square lg:aspect-4/5">
              <Image
                src={image}
                alt={title}
                fill
                sizes="(max-width:1024px) 100vw, 46vw"
                className="object-cover"
              />
            </div>
            {/* ice frame accent */}
            <div className="pointer-events-none absolute -inset-3 rounded-xl border border-white/15" />
          </Reveal>
        )}
      </div>
    </section>
  );
}
