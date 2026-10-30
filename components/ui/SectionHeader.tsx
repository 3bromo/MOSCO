import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
  hrefLabel,
  align = "start",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "mb-9 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "items-center text-center sm:flex-col sm:items-center",
        className,
      )}
    >
      <div className={cn(align === "center" && "max-w-2xl")}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="display-lg text-ice-900">{title}</h2>
        {subtitle && (
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ice-600">{subtitle}</p>
        )}
      </div>

      {href && hrefLabel && (
        <Link
          href={href}
          className="link-underline inline-flex shrink-0 items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em] text-ice-800 hover:text-ice-900"
        >
          {hrefLabel}
          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.75} />
        </Link>
      )}
    </Reveal>
  );
}
