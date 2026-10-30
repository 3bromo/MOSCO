import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { Address } from "@/lib/db/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(24)
    .regex(/^[0-9+\-\s()]+$/),
});

const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1).max(60),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(8).max(400),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  is_default: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const repo = db();
  const customer = await repo.getCustomerById(session.sub);
  if (!customer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "profile");

  if (action === "profile") {
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });
    await repo.saveCustomer({
      ...customer,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "address_save") {
    const parsed = addressSchema.safeParse(body.address);
    if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });
    const incoming = parsed.data;

    const entry: Address = {
      id: incoming.id || randomUUID(),
      label: incoming.label,
      city: incoming.city,
      address: incoming.address,
      notes: incoming.notes || undefined,
      is_default: Boolean(incoming.is_default) || customer.addresses.length === 0,
    };

    let addresses = incoming.id
      ? customer.addresses.map((a) => (a.id === incoming.id ? entry : a))
      : [...customer.addresses, entry];

    if (entry.is_default) {
      addresses = addresses.map((a) => ({ ...a, is_default: a.id === entry.id }));
    }

    await repo.saveCustomer({ ...customer, addresses, updated_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, addresses });
  }

  if (action === "address_delete") {
    const id = String(body.id ?? "");
    let addresses = customer.addresses.filter((a) => a.id !== id);
    if (addresses.length > 0 && !addresses.some((a) => a.is_default)) {
      addresses = addresses.map((a, i) => ({ ...a, is_default: i === 0 }));
    }
    await repo.saveCustomer({ ...customer, addresses, updated_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, addresses });
  }

  if (action === "address_default") {
    const id = String(body.id ?? "");
    const addresses = customer.addresses.map((a) => ({ ...a, is_default: a.id === id }));
    await repo.saveCustomer({ ...customer, addresses, updated_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, addresses });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
