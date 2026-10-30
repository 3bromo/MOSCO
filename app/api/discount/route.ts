import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { evaluateDiscount } from "@/lib/commerce/pricing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { code, subtotal } = (await req.json()) as { code?: string; subtotal?: number };
    if (!code?.trim()) return NextResponse.json({ valid: false, reason: "not_found" });

    const discount = await db().getDiscountByCode(code);
    const check = evaluateDiscount(discount, Number(subtotal) || 0, 0);

    return NextResponse.json({
      valid: check.valid,
      reason: check.reason ?? null,
      amount: check.amount,
      freeShipping: check.freeShipping,
      code: discount?.code ?? code.trim().toUpperCase(),
      type: discount?.type ?? null,
      value: discount?.value ?? null,
      min_subtotal: discount?.min_subtotal ?? null,
    });
  } catch {
    return NextResponse.json({ valid: false, reason: "not_found" }, { status: 200 });
  }
}
