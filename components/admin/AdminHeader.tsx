import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdminHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-ice-600 hover:text-ice-900"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.75} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[13.5px] text-ice-600">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
