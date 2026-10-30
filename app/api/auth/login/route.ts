import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let email = "";
  let password = "";
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!email || !password) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const customer = await db().getCustomerByEmail(email);
  // Same response for "no such user" and "wrong password" — no account enumeration.
  if (!customer || !(await verifyPassword(password, customer.password_hash))) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  await setSessionCookie({
    sub: customer.id,
    email: customer.email,
    name: customer.full_name,
    role: customer.role,
  });

  return NextResponse.json({ ok: true, role: customer.role });
}
