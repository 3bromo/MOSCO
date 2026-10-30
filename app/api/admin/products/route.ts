import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/auth/api-guard";
import { db } from "@/lib/db";
import { deleteImage } from "@/lib/media/store";
import type { Product } from "@/lib/db/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const num = z.number().finite().nullable().optional();

const sizeRow = z.object({
  size: z.string().trim().min(1).max(24),
  stock: z.number().int().min(0).max(100000),
  chest: num,
  shoulder: num,
  length: num,
  sleeve: num,
  waist: num,
  hip: num,
  inseam: num,
  thigh: num,
  legOpening: num,
  bodyHeightMin: num,
  bodyHeightMax: num,
  bodyWeightMin: num,
  bodyWeightMax: num,
});

const productSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(90)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase-with-dashes"),
  sku: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2).max(140),
  name_ar: z.string().trim().max(140).optional(),
  subtitle: z.string().trim().max(200).optional(),
  subtitle_ar: z.string().trim().max(200).optional(),
  description: z.string().trim().max(4000),
  description_ar: z.string().trim().max(4000).optional(),
  details: z.array(z.string().trim().max(300)).max(20),
  details_ar: z.array(z.string().trim().max(300)).max(20).optional(),
  price: z.number().int().min(0).max(10_000_000),
  compare_at_price: z.number().int().min(0).max(10_000_000).nullable().optional(),
  category: z.string().trim().min(1).max(60),
  collections: z.array(z.string().trim().max(60)).max(20),
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string().trim().min(1).max(600),
        alt: z.string().trim().max(200),
        alt_ar: z.string().trim().max(200).optional(),
        position: z.number().int().min(0).max(100),
        color: z.string().max(60).nullable().optional(),
      }),
    )
    .max(20),
  colors: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        name_ar: z.string().trim().max(60).optional(),
        hex: z
          .string()
          .trim()
          .regex(/^#[0-9a-fA-F]{6}$/),
      }),
    )
    .max(20),
  sizes: z.array(sizeRow).max(40),
  garment_type: z.enum(["top", "bottom", "set", "accessory", "footwear"]),
  intrinsic_fit: z.enum(["slim", "regular", "oversized"]),
  size_note: z.string().trim().max(400).optional(),
  size_note_ar: z.string().trim().max(400).optional(),
  badges: z.array(z.enum(["new", "bestseller", "sale", "limited"])).max(4),
  popularity: z.number().int().min(0).max(1_000_000).optional(),
  status: z.enum(["active", "draft", "archived"]),
  featured: z.boolean(),
  seo_title: z.string().trim().max(200).optional(),
  seo_description: z.string().trim().max(400).optional(),
});

export async function POST(req: Request) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".") || "form"] ||= i.message;
    return NextResponse.json({ error: "validation", fields }, { status: 400 });
  }

  const input = parsed.data;
  const repo = db();
  const now = new Date().toISOString();

  const existing = input.id ? await repo.getProductById(input.id) : null;

  // slug must stay unique
  const slugOwner = await repo.getProductBySlug(input.slug);
  if (slugOwner && slugOwner.id !== (existing?.id ?? "")) {
    return NextResponse.json(
      { error: "validation", fields: { slug: "slug_taken" } },
      { status: 409 },
    );
  }

  const product: Product = {
    id: existing?.id ?? randomUUID(),
    slug: input.slug,
    sku: input.sku,
    name: input.name,
    name_ar: input.name_ar || undefined,
    subtitle: input.subtitle || undefined,
    subtitle_ar: input.subtitle_ar || undefined,
    description: input.description,
    description_ar: input.description_ar || undefined,
    details: input.details.filter(Boolean),
    details_ar: input.details_ar?.filter(Boolean),
    price: input.price,
    compare_at_price: input.compare_at_price ?? null,
    category: input.category,
    collections: input.collections,
    images: input.images
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((im, i) => ({
        id: im.id ?? randomUUID(),
        url: im.url,
        alt: im.alt || input.name,
        alt_ar: im.alt_ar,
        position: i,
        color: im.color ?? null,
      })),
    colors: input.colors,
    sizes: input.sizes,
    garment_type: input.garment_type,
    intrinsic_fit: input.intrinsic_fit,
    size_note: input.size_note || undefined,
    size_note_ar: input.size_note_ar || undefined,
    badges: input.badges,
    popularity: input.popularity ?? existing?.popularity ?? 0,
    sold_count: existing?.sold_count ?? 0,
    status: input.status,
    featured: input.featured,
    seo_title: input.seo_title || undefined,
    seo_description: input.seo_description || undefined,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  // Clean up images the admin removed — but only ones we host ourselves.
  if (existing) {
    const keep = new Set(product.images.map((i) => i.url));
    for (const old of existing.images) {
      if (!keep.has(old.url) && (old.url.startsWith("/uploads/") || old.url.includes("/mosco-media/"))) {
        await deleteImage(old.url);
      }
    }
  }

  const saved = await repo.saveProduct(product);
  return NextResponse.json({ ok: true, product: saved });
}

export async function DELETE(req: Request) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const repo = db();
  const product = await repo.getProductById(id);
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Archive rather than destroy: past orders reference this product.
  await repo.saveProduct({ ...product, status: "archived", updated_at: new Date().toISOString() });
  return NextResponse.json({ ok: true, archived: true });
}
