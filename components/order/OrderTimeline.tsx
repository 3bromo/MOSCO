"use client";

import { useEffect } from "react";
import { ArrowRight, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrderTimeline({ order, orderNumber }: { order: any; orderNumber: string }) {
  useEffect(() => setTimeout(() => {}, 0), [order]);

  const statuses = [
    { key: "pending", title: "Pending", desc: "We've received your order and will confirm it shortly." },
    { key: "confirmed", title: "Confirmed", desc: "Your order is confirmed and queued for packing." },
    { key: "processing", title: "Processing", desc: "Your pieces are being prepared and packed." },
    { key: "shipped", title: "Shipped", desc: "Your order is with the courier." },
    { key: "delivered", title: "Delivered", desc: "Delivered. Thank you for choosing MOSCOW." },
    { key: "cancelled", title: "Cancelled", desc: "This order was cancelled." },
  ];

  const orderStatus = statuses.find((s) => s.key === order.status) || statuses[0];

  return (
    <div className="space-y-4">
      {order.status !== "cancelled" && (
        <ol className="flex items-start space-y-2 space-x-6">
          {statuses.map((status, i) => (
            <li key={status.key} className="flex items-start gap-3">
              <div
                className={cn(
                  "grid h-7 w-7 rounded-full bg-ice-100 place-items-center text-ice-500 shrink-0",
                  i < order.index ? "bg-ice-900 text-white" : "text-ice-200",
                )}
              >
                {i < order.index ? (
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                ) : null}
              </div>

              <div className="flex-1 min-w-0">
                <p className="mt-1 block text-[11.5px] tabular-nums text-ice-500">
                  {status.title}
                </p>
                <p className="mt-1 text-ice-400">{status.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {order.status === "cancelled" && (
        <div className="p-6 bg-red-50 rounded-lg">
          <p className="text-red-600">This order has been cancelled.</p>
        </div>
      )}
    </div>
  );
}
