import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { Customer } from "@/lib/db/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(24)
    .regex(/^[0-9+\-\s()]+$/),
  password: z.string().min(8).max(200),
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
    for (const i of parsed.error.issues) fields[i.path.join(".") || "form"] ||= i.message;
    return NextResponse.json({ error: "validation", fields }, { status: 400 });
  }

  const { full_name, email, phone, password } = parsed.data;
  const repo = db();

  const existing = await repo.getCustomerByEmail(email);
  if (existing) return NextResponse.json({ error: "exists" }, { status: 409 });

  const now = new Date().toISOString();
  const customer: Customer = {
    id: randomUUID(),
    email: email.toLowerCase(),
    phone,
    full_name,
    password_hash: await hashPassword(password),
    role: "customer", // never self-assignable
    addresses: [],
    wishlist: [],
    created_at: now,
    updated_at: now,
  };

  await repo.saveCustomer(customer);
  await setSessionCookie({
    sub: customer.id,
    email: customer.email,
    name: customer.full_name,
    role: "customer",
  });

  return NextResponse.json({ ok: true });
}
