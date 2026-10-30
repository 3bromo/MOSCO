import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/guards";
import { MAX_UPLOAD_BYTES, storeImage } from "@/lib/media/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Folder = "products" | "banners" | "proofs" | "brand";

/**
 * Image upload.
 *  - folder "proofs"  → open to shoppers (InstaPay payment proof at checkout)
 *  - every other folder → admin session required
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const folderRaw = String(form.get("folder") ?? "products");
    const folder: Folder = (["products", "banners", "proofs", "brand"] as const).includes(
      folderRaw as Folder,
    )
      ? (folderRaw as Folder)
      : "products";

    if (folder !== "proofs" && !(await isAdmin())) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const files = form.getAll("file").filter((f): f is File => f instanceof File);
    if (files.length === 0) return NextResponse.json({ error: "no_file" }, { status: 400 });
    if (files.length > 10) return NextResponse.json({ error: "too_many" }, { status: 400 });

    const uploaded = [];
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "too_large" }, { status: 413 });
      }
      uploaded.push(await storeImage(file, folder, folder === "proofs" ? 1400 : 2000));
    }

    return NextResponse.json({ ok: true, files: uploaded });
  } catch (err) {
    const message = err instanceof Error ? err.message : "server_error";
    const status = message === "unsupported_type" ? 415 : message === "too_large" ? 413 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
