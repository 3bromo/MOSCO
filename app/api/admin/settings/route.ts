import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/auth/api-guard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bannerSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().max(160),
  title_ar: z.string().trim().max(160).optional(),
  subtitle: z.string().trim().max(300).optional(),
  subtitle_ar: z.string().trim().max(300).optional(),
  image: z.string().trim().max(600).nullable().optional(),
  cta_label: z.string().trim().max(60).optional(),
  cta_label_ar: z.string().trim().max(60).optional(),
  cta_href: z.string().trim().max(300).optional(),
  position: z.number().int().min(0).max(99),
  visible: z.boolean(),
  placement: z.enum(["announcement", "home"]),
});

const schema = z.object({
  brand_name: z.string().trim().min(1).max(60).optional(),
  tagline: z.string().trim().max(200).optional(),
  tagline_ar: z.string().trim().max(200).optional(),
  contact_email: z.string().trim().email().max(160).optional(),
  contact_phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  instagram: z.string().trim().max(80).optional(),
  tiktok: z.string().trim().max(80).optional(),
  address_line: z.string().trim().max(200).optional(),
  address_line_ar: z.string().trim().max(200).optional(),

  shipping_flat: z.number().int().min(0).max(100000).optional(),
  free_shipping_threshold: z.number().int().min(0).max(10_000_000).optional(),
  shipping_rates: z
    .array(
      z.object({
        city: z.string().trim().min(1).max(80),
        city_ar: z.string().trim().max(80).optional(),
        cost: z.number().int().min(0).max(100000),
      }),
    )
    .max(60)
    .optional(),

  instapay_handle: z.string().trim().max(120).optional(),
  instapay_name: z.string().trim().max(120).optional(),
  instapay_instructions: z.string().trim().max(2000).optional(),
  instapay_instructions_ar: z.string().trim().max(2000).optional(),

  home_hero_title: z.string().trim().max(200).optional(),
  home_hero_title_ar: z.string().trim().max(200).optional(),
  home_hero_sub: z.string().trim().max(400).optional(),
  home_hero_sub_ar: z.string().trim().max(400).optional(),
  home_story_title: z.string().trim().max(200).optional(),
  home_story_title_ar: z.string().trim().max(200).optional(),
  home_story_body: z.string().trim().max(3000).optional(),
  home_story_body_ar: z.string().trim().max(3000).optional(),
  home_story_image: z.string().trim().max(600).nullable().optional(),
  about_body: z.string().trim().max(6000).optional(),
  about_body_ar: z.string().trim().max(6000).optional(),

  banners: z.array(bannerSchema).max(12).optional(),

  fit_ai: z
    .object({
      enabled: z.boolean(),
      show_confidence: z.boolean(),
      ease_slim: z.number().min(0).max(60),
      ease_regular: z.number().min(0).max(60),
      ease_oversized: z.number().min(0).max(80),
      tolerance: z.number().min(0.5).max(30),
      disclaimer: z.string().trim().max(600).optional(),
      disclaimer_ar: z.string().trim().max(600).optional(),
    })
    .optional(),
});

export async function PATCH(req: Request) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".") || "form"] ||= i.message;
    return NextResponse.json({ error: "validation", fields }, { status: 400 });
  }

  const repo = db();
  const current = await repo.getSettings();

  const saved = await repo.saveSettings({
    ...current,
    ...parsed.data,
    fit_ai: parsed.data.fit_ai ? { ...current.fit_ai, ...parsed.data.fit_ai } : current.fit_ai,
    id: "settings",
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, settings: saved });
}
