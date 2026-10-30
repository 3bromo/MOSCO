"use client";

import { cn } from "@/lib/utils";

const statuses = [
  { key: "pending", title: "Pending", desc: "We've received your order and will confirm it shortly." },
  { key: "confirmed", title: "Confirmed", desc: "Your order is confirmed and queued for packing." },
  { key: "processing", title: "Processing", desc: "Your pieces are being prepared and packed." },
  { key: "shipped", title: "Shipped", desc: "Your order is with the courier." },
  { key: "delivered", title: "Delivered", desc: "Delivered. Thank you for choosing MOSCOW." },
  { key: "cancelled", title: "Cancelled", desc: "This order was cancelled." },
];

export function useTrackTimeline(order: any) {
  const orderStatus = statuses.find((s) => s.key === order.status) || statuses[0];

  return {
    orderStatus,
    statuses,
  };
}
