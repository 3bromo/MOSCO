import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { evaluateDiscount, shippingFor } from "@/lib/commerce/pricing";
import { db } from "@/lib/db";
import type { Order, OrderItem } from "@/lib/db/types";
import { stockForSize } from "@/lib/db/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function orderNumber(): string {
  const bytes = randomBytes(7);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `MW-${out.slice(0, 4)}-${out.slice(4)}`;
}

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(24)
    .regex(/^[0-9+\-\s()]+$/),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(8).max(400),
  notes: z.string().trim().max(600).optional().or(z.literal("")),
  payment_method: z.enum(["cod", "instapay"]),
  payment_proof_url: z.string().trim().max(600).optional().or(z.literal("")),
  discount_code: z.string().trim().max(40).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        product_id: z.string().min(1),
        size: z.string().min(1).max(24),
        color: z.string().max(60).nullable().optional(),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(40),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json({ error: "validation", fields }, { status: 400 });
  }

  const input = parsed.data;

  if (input.payment_method === "instapay" && !input.payment_proof_url) {
    return NextResponse.json(
      { error: "validation", fields: { payment_proof_url: "required" } },
      { status: 400 },
    );
  }

  const repo = db();

  /* --------- rebuild the order from the database, never from the client ------ */
  const items: OrderItem[] = [];
  for (const line of input.items) {
    const p = await repo.getProductById(line.product_id);
    if (!p || p.status !== "active") {
      return NextResponse.json({ error: "item_unavailable", product_id: line.product_id }, { status: 409 });
    }
    const available = stockForSize(p, line.size);
    if (available < line.qty) {
      return NextResponse.json(
        { error: "insufficient_stock", product_id: p.id, size: line.size, available },
        { status: 409 },
      );
    }
    items.push({
      product_id: p.id,
      slug: p.slug,
      name: p.name,
      name_ar: p.name_ar,
      image: p.images[0]?.url ?? "",
      size: line.size,
      color: line.color ?? p.colors[0]?.name ?? null,
      qty: line.qty,
      unit_price: p.price, // authoritative price
    });
  }

  const settings = await repo.getSettings();
  const subtotal = items.reduce((n, i) => n + i.unit_price * i.qty, 0);
  const ship = shippingFor(settings, input.city, subtotal);

  const discountRow = input.discount_code
    ? await repo.getDiscountByCode(input.discount_code)
    : null;
  const check = evaluateDiscount(discountRow, subtotal, ship.cost);

  const shipping = check.freeShipping ? 0 : ship.cost;
  const discount = check.valid ? check.amount : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const session = await getSession();
  const now = new Date().toISOString();

  const order: Order = {
    id: randomUUID(),
    order_number: orderNumber(),
    customer_id: session?.sub ?? null,
    full_name: input.full_name,
    phone: input.phone,
    email: input.email || undefined,
    city: input.city,
    address: input.address,
    notes: input.notes || undefined,
    items,
    subtotal,
    shipping,
    discount,
    discount_code: check.valid && discountRow ? discountRow.code : null,
    total,
    payment_method: input.payment_method,
    payment_status: input.payment_method === "instapay" ? "proof_submitted" : "unpaid",
    payment_proof_url: input.payment_proof_url || null,
    status: "pending",
    timeline: [
      {
        status: "pending",
        at: now,
        note:
          input.payment_method === "instapay"
            ? "Order received — InstaPay proof submitted, awaiting verification."
            : "Order received — cash on delivery.",
      },
    ],
    created_at: now,
    updated_at: now,
  };

  await repo.saveOrder(order);
  await repo.decrementStock(items.map((i) => ({ product_id: i.product_id, size: i.size, qty: i.qty })));

  if (check.valid && discountRow) {
    await repo.saveDiscount({ ...discountRow, used: discountRow.used + 1 });
  }

  return NextResponse.json({
    ok: true,
    order_number: order.order_number,
    total: order.total,
    payment_method: order.payment_method,
  });
}
