import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidEmail } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }
    await db().addNewsletter(email);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
