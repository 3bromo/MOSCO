import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  crumbs,
  align = "start",
  tone = "light",
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  align?: "start" | "center";
  tone?: "light" | "ice";
  children?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "border-b border-silver-200",
        tone === "ice" ? "bg-gradient-to-b from-ice-100 to-ice-50" : "bg-white",
      )}
    >
      <div
        className={cn(
          "mw-container py-10 sm:py-14",
          align === "center" && "flex flex-col items-center text-center",
        )}
      >
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1 text-[12px] text-ice-500">
              {crumbs.map((c, i) => (
                <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                  {c.href ? (
                    <Link href={c.href} className="hover:text-ice-900">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-ice-800">{c.label}</span>
                  )}
                  {i < crumbs.length - 1 && (
                    <ChevronRight className="h-3 w-3 rtl:rotate-180" strokeWidth={2} />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <Reveal>
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1 className="display-lg text-ice-900">{title}</h1>
          {subtitle && (
            <p
              className={cn(
                "mt-4 max-w-2xl text-[15px] leading-relaxed text-ice-600",
                align === "center" && "mx-auto",
              )}
            >
              {subtitle}
            </p>
          )}
        </Reveal>

        {children}
      </div>
    </header>
  );
}
