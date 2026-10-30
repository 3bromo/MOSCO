import { NextResponse } from "next/server";
import { currentCustomer } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Mirrors the guest localStorage wishlist onto the customer record when
 * someone is signed in. Silently no-ops for guests so the UI never blocks.
 */
export async function POST(req: Request) {
  try {
    const me = await currentCustomer();
    if (!me) return NextResponse.json({ ok: true, synced: false });

    const { id, action } = (await req.json()) as { id?: string; action?: "add" | "remove" };
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

    const full = await db().getCustomerById(me.id);
    if (!full) return NextResponse.json({ ok: true, synced: false });

    const set = new Set(full.wishlist ?? []);
    if (action === "remove") set.delete(id);
    else set.add(id);

    await db().saveCustomer({
      ...full,
      wishlist: [...set],
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, synced: true, wishlist: [...set] });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET() {
  const me = await currentCustomer();
  return NextResponse.json({ wishlist: me?.wishlist ?? [] });
}
