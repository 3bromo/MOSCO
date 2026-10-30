"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    // Surface the digest so a server log line can be matched to this screen.
    console.error("MOSCOW route error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mw-container flex min-h-[70vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-3xl uppercase tracking-tight">{t("error.title")}</h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ice-600">
        {t("error.sub")}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
          {t("error.retry")}
        </button>
        <Link href="/" className="btn btn-ghost">
          MOSCOW
        </Link>
      </div>

      {error.digest && (
        <code className="mt-8 rounded bg-ice-50 px-3 py-1.5 font-mono text-[11.5px] text-ice-500">
          {error.digest}
        </code>
      )}
    </div>
  );
}
