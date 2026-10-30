import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { SUPABASE_BUCKET, isSupabaseEnabled } from "@/lib/supabase/env";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

export interface StoredMedia {
  url: string;
  path: string;
  width: number;
  height: number;
  bytes: number;
}

function safeName(prefix: string, ext: string) {
  return `${prefix}-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${ext}`;
}

/**
 * Normalises any uploaded image to a web-safe WebP.
 *
 * IMPORTANT: this only re-encodes and bounds the pixel dimensions. It never
 * recolours, crops creatively, filters or otherwise alters how the garment
 * looks — real product photography must stay exactly as the brand shot it.
 */
async function normalise(buf: Buffer, maxWidth: number) {
  const img = sharp(buf, { failOn: "none" }).rotate(); // honour EXIF orientation only
  const meta = await img.metadata();
  const width = meta.width ?? maxWidth;

  const pipeline = width > maxWidth ? img.resize({ width: maxWidth, withoutEnlargement: true }) : img;
  const out = await pipeline.webp({ quality: 88, effort: 4 }).toBuffer({ resolveWithObject: true });

  return { data: out.data, width: out.info.width, height: out.info.height };
}

/**
 * Persists an uploaded image.
 *  - Supabase configured → Storage bucket (public URL)
 *  - otherwise           → public/uploads (served straight off the filesystem)
 */
export async function storeImage(
  file: File,
  folder: "products" | "banners" | "proofs" | "brand" = "products",
  maxWidth = 2000,
): Promise<StoredMedia> {
  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    throw new Error("unsupported_type");
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("too_large");

  const input = Buffer.from(await file.arrayBuffer());
  const { data, width, height } = await normalise(input, maxWidth);
  const filename = safeName(folder, "webp");
  const key = `${folder}/${filename}`;

  if (isSupabaseEnabled()) {
    const { supabaseAdmin } = await import("@/lib/supabase/server");
    const client = supabaseAdmin();
    const { error } = await client.storage.from(SUPABASE_BUCKET).upload(key, data, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data: pub } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
    return { url: pub.publicUrl, path: key, width, height, bytes: data.byteLength };
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), data);
  return {
    url: `/uploads/${key}`,
    path: key,
    width,
    height,
    bytes: data.byteLength,
  };
}

/** Best-effort delete. Never throws — a missing file must not break an edit. */
export async function deleteImage(url: string): Promise<void> {
  try {
    if (!url) return;
    if (isSupabaseEnabled() && !url.startsWith("/uploads/")) {
      const marker = `/${SUPABASE_BUCKET}/`;
      const idx = url.indexOf(marker);
      if (idx === -1) return;
      const key = decodeURIComponent(url.slice(idx + marker.length));
      const { supabaseAdmin } = await import("@/lib/supabase/server");
      await supabaseAdmin().storage.from(SUPABASE_BUCKET).remove([key]);
      return;
    }
    if (url.startsWith("/uploads/")) {
      // Never allow traversal outside the uploads root.
      const rel = url.replace(/^\/uploads\//, "");
      if (rel.includes("..")) return;
      const abs = path.join(process.cwd(), "public", "uploads", rel);
      await unlink(abs);
    }
  } catch {
    /* already gone — fine */
  }
}
