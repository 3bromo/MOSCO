import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stockForSize } from "@/lib/db/types";

export const dynamic = "force-dynamic";

interface Incoming {
  product_id: string;
  size: string;
  qty: number;
}

/**
 * Re-prices and re-validates a cart against the database.
 * The client store is a convenience cache only — price and stock are always
 * taken from here before anything is shown as a total or submitted as an order.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { items?: Incoming[] };
    const items = Array.isArray(body.items) ? body.items : [];
    const repo = db();

    const lines = [];
    const issues: { product_id: string; size: string; type: string; available: number }[] = [];

    for (const it of items) {
      const p = await repo.getProductById(it.product_id);
      if (!p || p.status !== "active") {
        issues.push({ product_id: it.product_id, size: it.size, type: "unavailable", available: 0 });
        continue;
      }

      const available = stockForSize(p, it.size);
      const sizeExists = p.sizes.some((s) => s.size === it.size);

      if (!sizeExists) {
        issues.push({ product_id: p.id, size: it.size, type: "size_gone", available: 0 });
      } else if (available <= 0) {
        issues.push({ product_id: p.id, size: it.size, type: "out_of_stock", available: 0 });
      } else if (it.qty > available) {
        issues.push({ product_id: p.id, size: it.size, type: "qty_reduced", available });
      }

      lines.push({
        product_id: p.id,
        slug: p.slug,
        name: p.name,
        name_ar: p.name_ar,
        image: p.images[0]?.url ?? "",
        size: it.size,
        qty: Math.max(0, Math.min(it.qty, available)),
        unit_price: p.price,
        compare_at_price: p.compare_at_price ?? null,
        max: available,
        /* every in-stock size, so the cart can offer a size swap inline */
        sizes: p.sizes.map((s) => ({ size: s.size, stock: s.stock })),
      });
    }

    const settings = await repo.getSettings();

    return NextResponse.json({
      lines,
      issues,
      settings: {
        shipping_flat: settings.shipping_flat,
        free_shipping_threshold: settings.free_shipping_threshold,
        shipping_rates: settings.shipping_rates,
      },
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
