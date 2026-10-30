import type { OrderStatus } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const TONE: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-ice-100 text-ice-800 ring-ice-300",
  processing: "bg-ice-100 text-ice-800 ring-ice-300",
  shipped: "bg-sky-50 text-sky-800 ring-sky-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

export default function OrderStatusBadge({
  status,
  label,
  className,
}: {
  status: OrderStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11.5px] font-medium uppercase tracking-[0.08em] ring-1 ring-inset",
        TONE[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
