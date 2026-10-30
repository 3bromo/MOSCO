import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ products: [] });

  try {
    const products = await db().listProducts({ search: q, limit: 6, sort: "popular" });
    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        name_ar: p.name_ar,
        price: p.price,
        image: p.images[0]?.url ?? "/products/monogram-denim-set-full.jpeg",
      })),
    });
  } catch {
    return NextResponse.json({ products: [] }, { status: 200 });
  }
}
