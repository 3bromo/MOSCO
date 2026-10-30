import type { Discount, Settings } from "@/lib/db/types";

export interface CartLineLike {
  unit_price: number;
  qty: number;
}

export interface Totals {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  freeShippingApplied: boolean;
  remainingForFreeShipping: number;
}

export function subtotalOf(lines: CartLineLike[]): number {
  return lines.reduce((s, l) => s + l.unit_price * l.qty, 0);
}

export function shippingFor(
  settings: Pick<Settings, "shipping_flat" | "free_shipping_threshold" | "shipping_rates">,
  city: string | null | undefined,
  subtotal: number,
): { cost: number; free: boolean } {
  if (settings.free_shipping_threshold > 0 && subtotal >= settings.free_shipping_threshold) {
    return { cost: 0, free: true };
  }
  const rate = city
    ? settings.shipping_rates.find((r) => r.city.toLowerCase() === city.toLowerCase())
    : undefined;
  return { cost: rate ? rate.cost : settings.shipping_flat, free: false };
}

export interface DiscountCheck {
  valid: boolean;
  reason?: "not_found" | "inactive" | "expired" | "min_subtotal" | "usage_limit";
  amount: number;
  freeShipping: boolean;
}

export function evaluateDiscount(
  discount: Discount | null,
  subtotal: number,
  shipping: number,
): DiscountCheck {
  if (!discount) return { valid: false, reason: "not_found", amount: 0, freeShipping: false };
  if (!discount.active) return { valid: false, reason: "inactive", amount: 0, freeShipping: false };

  const now = Date.now();
  if (discount.starts_at && new Date(discount.starts_at).getTime() > now) {
    return { valid: false, reason: "inactive", amount: 0, freeShipping: false };
  }
  if (discount.expires_at && new Date(discount.expires_at).getTime() < now) {
    return { valid: false, reason: "expired", amount: 0, freeShipping: false };
  }
  if (discount.usage_limit != null && discount.used >= discount.usage_limit) {
    return { valid: false, reason: "usage_limit", amount: 0, freeShipping: false };
  }
  if (subtotal < discount.min_subtotal) {
    return { valid: false, reason: "min_subtotal", amount: 0, freeShipping: false };
  }

  if (discount.type === "free_shipping") {
    return { valid: true, amount: 0, freeShipping: true };
  }
  const raw =
    discount.type === "percent"
      ? Math.round((subtotal * discount.value) / 100)
      : Math.round(discount.value);
  return { valid: true, amount: Math.min(raw, subtotal), freeShipping: false };
}

export function computeTotals(
  lines: CartLineLike[],
  settings: Pick<Settings, "shipping_flat" | "free_shipping_threshold" | "shipping_rates">,
  city: string | null | undefined,
  discount: Discount | null,
): Totals {
  const subtotal = subtotalOf(lines);
  const ship = shippingFor(settings, city, subtotal);
  const check = evaluateDiscount(discount, subtotal, ship.cost);

  const shipping = check.freeShipping ? 0 : ship.cost;
  const discountAmount = check.valid ? check.amount : 0;
  const total = Math.max(0, subtotal - discountAmount + shipping);

  return {
    subtotal,
    shipping,
    discount: discountAmount,
    total,
    freeShippingApplied: ship.free || check.freeShipping,
    remainingForFreeShipping: Math.max(0, settings.free_shipping_threshold - subtotal),
  };
}
