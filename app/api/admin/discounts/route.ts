import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/auth/api-guard";
import { db } from "@/lib/db";
import type { Discount } from "@/lib/db/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  id: z.string().optional(),
  code: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/),
  type: z.enum(["percent", "fixed", "free_shipping"]),
  value: z.number().min(0).max(1_000_000),
  min_subtotal: z.number().int().min(0).max(10_000_000),
  active: z.boolean(),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  usage_limit: z.number().int().min(1).max(1_000_000).nullable().optional(),
});

export async function POST(req: Request) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".") || "form"] ||= i.message;
    return NextResponse.json({ error: "validation", fields }, { status: 400 });
  }

  const input = parsed.data;
  const repo = db();
  const code = input.code.toUpperCase();

  const owner = await repo.getDiscountByCode(code);
  if (owner && owner.id !== (input.id ?? "")) {
    return NextResponse.json({ error: "validation", fields: { code: "code_taken" } }, { status: 409 });
  }

  const discount: Discount = {
    id: input.id || randomUUID(),
    code,
    type: input.type,
    value: input.type === "percent" ? Math.min(100, input.value) : input.value,
    min_subtotal: input.min_subtotal,
    active: input.active,
    starts_at: input.starts_at || null,
    expires_at: input.expires_at || null,
    usage_limit: input.usage_limit ?? null,
    used: owner?.used ?? 0,
    created_at: owner?.created_at ?? new Date().toISOString(),
  };

  const saved = await repo.saveDiscount(discount);
  return NextResponse.json({ ok: true, discount: saved });
}

export async function DELETE(req: Request) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  await db().deleteDiscount(id);
  return NextResponse.json({ ok: true });
}
