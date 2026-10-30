import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/auth/api-guard";
import { db } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/db/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).optional(),
  payment_status: z.enum(["unpaid", "proof_submitted", "paid", "refunded"]).optional(),
  note: z.string().trim().max(400).optional(),
});

export async function PATCH(req: Request) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });

  const { id, status, payment_status, note } = parsed.data;
  const repo = db();
  const order = await repo.getOrderById(id);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const now = new Date().toISOString();
  const statusChanged = Boolean(status && status !== order.status);

  // Cancelling returns the reserved units to stock, once.
  if (statusChanged && status === "cancelled" && order.status !== "cancelled") {
    await repo.decrementStock(
      order.items.map((i) => ({ product_id: i.product_id, size: i.size, qty: -i.qty })),
    );
  }

  const updated = {
    ...order,
    status: status ?? order.status,
    payment_status: payment_status ?? order.payment_status,
    timeline: statusChanged
      ? [...order.timeline, { status: status!, at: now, note: note || undefined }]
      : order.timeline,
    updated_at: now,
  };

  const saved = await repo.saveOrder(updated);
  return NextResponse.json({ ok: true, order: saved, statuses: ORDER_STATUSES });
}
