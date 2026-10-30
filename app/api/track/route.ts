import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Constant-time-ish phone comparison on the last 8 digits. */
function phoneMatches(stored: string, given: string) {
  const a = stored.replace(/\D/g, "").slice(-8);
  const b = given.replace(/\D/g, "").slice(-8);
  return a.length >= 6 && a === b;
}

export async function POST(req: Request) {
  try {
    const { order_number, phone } = (await req.json()) as {
      order_number?: string;
      phone?: string;
    };

    const num = String(order_number ?? "").trim().toUpperCase();
    const tel = String(phone ?? "").trim();
    if (!num || !tel) return NextResponse.json({ found: false }, { status: 200 });

    const order = await db().getOrderByNumber(num);
    // Order number AND phone must both match — the number alone is not a key.
    if (!order || !phoneMatches(order.phone, tel)) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    return NextResponse.json({
      found: true,
      order: {
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        timeline: order.timeline,
        items: order.items.map((i) => ({
          name: i.name,
          name_ar: i.name_ar,
          slug: i.slug,
          image: i.image,
          size: i.size,
          qty: i.qty,
          unit_price: i.unit_price,
        })),
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        city: order.city,
        full_name: order.full_name,
      },
    });
  } catch {
    return NextResponse.json({ found: false }, { status: 200 });
  }
}
