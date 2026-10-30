import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(3000),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const i of parsed.error.issues) fields[i.path.join(".") || "form"] ||= i.message;
      return NextResponse.json({ error: "validation", fields }, { status: 400 });
    }

    await db().addMessage({
      id: randomUUID(),
      ...parsed.data,
      read: false,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
