"use client";

import { Check, Info, X } from "lucide-react";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

export default function Toaster() {
  const { toasts, dismiss } = useUI();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg px-4 py-3 shadow-lift backdrop-blur-xl animate-fade-up",
            t.tone === "error"
              ? "border border-red-200 bg-red-50/95 text-red-900"
              : t.tone === "success"
                ? "border border-ice-300 bg-white/95 text-ice-900"
                : "border border-silver-200 bg-white/95 text-ice-900",
          )}
        >
          <span
            className={cn(
              "grid h-6 w-6 shrink-0 place-items-center rounded-full",
              t.tone === "error" ? "bg-red-600 text-white" : "bg-ice-900 text-white",
            )}
          >
            {t.tone === "error" ? (
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : t.tone === "success" ? (
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
              <Info className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
          </span>
          <p className="flex-1 text-[13px] leading-snug">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="shrink-0 rounded-full p-1 opacity-50 transition-opacity hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
}
