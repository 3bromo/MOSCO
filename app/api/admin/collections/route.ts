import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/auth/api-guard";
import { db } from "@/lib/db";
import type { Collection } from "@/lib/db/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(100),
  name_ar: z.string().trim().max(100).optional(),
  description: z.string().trim().max(600).optional(),
  description_ar: z.string().trim().max(600).optional(),
  image: z.string().trim().max(600).nullable().optional(),
  kind: z.enum(["category", "collection"]),
  position: z.number().int().min(0).max(999),
  featured: z.boolean(),
  visible: z.boolean(),
  auto_badge: z.enum(["new", "bestseller", "sale", "limited"]).nullable().optional(),
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

  const owner = await repo.getCollectionBySlug(input.slug);
  if (owner && owner.id !== (input.id ?? "")) {
    return NextResponse.json({ error: "validation", fields: { slug: "slug_taken" } }, { status: 409 });
  }

  const collection: Collection = {
    id: input.id || randomUUID(),
    slug: input.slug,
    name: input.name,
    name_ar: input.name_ar || undefined,
    description: input.description || undefined,
    description_ar: input.description_ar || undefined,
    image: input.image ?? null,
    kind: input.kind,
    position: input.position,
    featured: input.featured,
    visible: input.visible,
    auto_badge: input.auto_badge ?? null,
    created_at: owner?.created_at ?? new Date().toISOString(),
  };

  const saved = await repo.saveCollection(collection);
  return NextResponse.json({ ok: true, collection: saved });
}

export async function DELETE(req: Request) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  await db().deleteCollection(id);
  return NextResponse.json({ ok: true });
}
