import { Check, CircleDashed, XCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import type { Order, OrderStatus } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const FLOW: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function OrderTimeline({ order, locale }: { order: Order; locale: Locale }) {
  const t = (k: string) => translate(locale, k);
  const cancelled = order.status === "cancelled";
  const currentIndex = cancelled ? -1 : FLOW.indexOf(order.status);

  const stamps = new Map<OrderStatus, string>();
  for (const entry of order.timeline) stamps.set(entry.status, entry.at);

  const steps: { status: OrderStatus; done: boolean; active: boolean }[] = cancelled
    ? [{ status: "cancelled", done: true, active: true }]
    : FLOW.map((s, i) => ({
        status: s,
        done: i < currentIndex,
        active: i === currentIndex,
      }));

  return (
    <ol className="mt-4 space-y-0">
      {steps.map((step, i) => {
        const at = stamps.get(step.status);
        const last = i === steps.length - 1;
        const reached = step.done || step.active;

        return (
          <li key={step.status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1 transition-colors",
                  step.status === "cancelled"
                    ? "bg-red-50 text-red-600 ring-red-200"
                    : step.active
                      ? "bg-ice-900 text-white ring-ice-900"
                      : step.done
                        ? "bg-ice-100 text-ice-800 ring-ice-200"
                        : "bg-white text-ice-300 ring-silver-200",
                )}
              >
                {step.status === "cancelled" ? (
                  <XCircle className="h-4 w-4" strokeWidth={1.6} />
                ) : reached ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                ) : (
                  <CircleDashed className="h-3.5 w-3.5" strokeWidth={1.6} />
                )}
              </span>
              {!last && (
                <span
                  className={cn(
                    "my-1 w-px flex-1 transition-colors",
                    step.done ? "bg-ice-400" : "bg-silver-200",
                  )}
                />
              )}
            </div>

            <div className={cn("min-w-0 pb-7", last && "pb-0")}>
              <p
                className={cn(
                  "text-[14px] font-medium leading-tight",
                  reached ? "text-ice-900" : "text-ice-400",
                )}
              >
                {t(`status.${step.status}`)}
              </p>
              <p
                className={cn(
                  "mt-1 text-[12.5px] leading-snug",
                  reached ? "text-ice-600" : "text-ice-400",
                )}
              >
                {t(`status.${step.status}Desc`)}
              </p>
              {at && (
                <time
                  dateTime={at}
                  className="mt-1 block text-[11.5px] tabular-nums text-ice-500"
                  dir="ltr"
                >
                  {new Date(at).toLocaleString("en" ? "en-GB" : "en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
