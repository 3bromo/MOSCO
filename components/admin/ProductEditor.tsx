"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Info, Loader2, Plus, Save, Trash2 } from "lucide-react";
import ImageUploader, { type EditableImage } from "@/components/admin/ImageUploader";
import type { Product, SizeRow } from "@/lib/db/types";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

type Tab = "basics" | "media" | "sizes" | "fit" | "seo";

/** Measurement columns offered per garment type — no universal chart. */
const MEASURES: { key: keyof SizeRow; label: string; hint: string }[] = [
  { key: "chest", label: "Chest", hint: "Flat, armpit to armpit" },
  { key: "shoulder", label: "Shoulder", hint: "Seam to seam" },
  { key: "sleeve", label: "Sleeve", hint: "Shoulder seam to cuff" },
  { key: "length", label: "Length", hint: "High point shoulder to hem" },
  { key: "waist", label: "Waist", hint: "Flat across the waistband" },
  { key: "hip", label: "Hip", hint: "Flat, widest point" },
  { key: "thigh", label: "Thigh", hint: "Flat, below the crotch" },
  { key: "inseam", label: "Inseam", hint: "Crotch to hem" },
  { key: "legOpening", label: "Leg opening", hint: "Flat across the hem" },
];

const DEFAULT_COLUMNS: Record<Product["garment_type"], (keyof SizeRow)[]> = {
  top: ["chest", "shoulder", "sleeve", "length"],
  bottom: ["waist", "hip", "thigh", "inseam", "legOpening"],
  set: ["chest", "shoulder", "length", "waist", "hip", "inseam"],
  accessory: [],
  footwear: ["length"],
};

const BADGES = ["new", "bestseller", "sale", "limited"] as const;

function emptyProduct(): Omit<Product, "id" | "created_at" | "updated_at" | "sold_count"> {
  return {
    slug: "",
    sku: "",
    name: "",
    name_ar: "",
    subtitle: "",
    subtitle_ar: "",
    description: "",
    description_ar: "",
    details: [],
    details_ar: [],
    price: 0,
    compare_at_price: null,
    category: "",
    collections: [],
    images: [],
    colors: [],
    sizes: [],
    garment_type: "top",
    intrinsic_fit: "regular",
    size_note: "",
    size_note_ar: "",
    badges: [],
    popularity: 0,
    status: "draft",
    featured: false,
    seo_title: "",
    seo_description: "",
  };
}

export default function ProductEditor({
  product,
  collections,
  fitEnabled,
}: {
  product: Product | null;
  collections: { slug: string; name: string; kind: string }[];
  fitEnabled: boolean;
}) {
  const router = useRouter();
  const toast = useUI((s) => s.toast);

  const [tab, setTab] = useState<Tab>("basics");
  const [form, setForm] = useState(() => (product ? { ...product } : emptyProduct()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const categories = collections.filter((c) => c.kind === "category");
  const curated = collections.filter((c) => c.kind === "collection");

  type Form = typeof form;
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key as string]: "" }));
  };

  /* Which measurement columns to show: whatever this product already uses,
     plus the sensible defaults for its garment type. */
  const [extraCols, setExtraCols] = useState<(keyof SizeRow)[]>([]);
  const columns = useMemo(() => {
    const used = new Set<keyof SizeRow>();
    for (const row of form.sizes) {
      for (const m of MEASURES) {
        const v = row[m.key];
        if (typeof v === "number" && Number.isFinite(v)) used.add(m.key);
      }
    }
    for (const c of DEFAULT_COLUMNS[form.garment_type]) used.add(c);
    for (const c of extraCols) used.add(c);
    return MEASURES.filter((m) => used.has(m.key));
  }, [form.sizes, form.garment_type, extraCols]);

  const addSize = () =>
    set("sizes", [...form.sizes, { size: "", stock: 0 } as SizeRow]);

  const updateSize = (index: number, patch: Partial<SizeRow>) =>
    set(
      "sizes",
      form.sizes.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );

  const removeSize = (index: number) =>
    set("sizes", form.sizes.filter((_, i) => i !== index));

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Required";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) e.slug = "lowercase-with-dashes";
    if (!form.sku.trim()) e.sku = "Required";
    if (!form.category.trim()) e.category = "Pick a category";
    if (!Number.isFinite(form.price) || form.price <= 0) e.price = "Must be above 0";
    if (form.sizes.some((s) => !s.size.trim())) e.sizes = "Every size row needs a label";
    const labels = form.sizes.map((s) => s.size.trim().toLowerCase());
    if (new Set(labels).size !== labels.length) e.sizes = "Duplicate size labels";
    return e;
  };

  const save = async () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      toast("Fix the highlighted fields.", "error");
      if (found.name || found.slug || found.sku || found.category || found.price) setTab("basics");
      else if (found.sizes) setTab("sizes");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        ...form,
        id: product?.id,
        price: Math.round(form.price),
        compare_at_price: form.compare_at_price ? Math.round(form.compare_at_price) : null,
        details: form.details.filter((d) => d.trim()),
        details_ar: (form.details_ar ?? []).filter((d) => d.trim()),
        sizes: form.sizes.map((s) => ({
          ...s,
          size: s.size.trim(),
          stock: Math.max(0, Math.round(s.stock || 0)),
        })),
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) {
          setErrors(data.fields);
          toast(
            data.fields.slug === "slug_taken"
              ? "That URL slug is already used by another product."
              : "Fix the highlighted fields.",
            "error",
          );
        } else {
          toast("Could not save.", "error");
        }
        return;
      }

      toast("Saved to the database.", "success");
      if (!product) router.push(`/admin/products/${data.product.id}`);
      else router.refresh();
    } catch {
      toast("Could not save.", "error");
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    if (!product) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });
      if (!res.ok) throw new Error();
      toast("Product archived. Past orders keep their history.", "success");
      router.push("/admin/products");
    } catch {
      toast("Could not archive.", "error");
    } finally {
      setBusy(false);
    }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "basics", label: "Basics & pricing" },
    { id: "media", label: `Images (${form.images.length})` },
    { id: "sizes", label: `Sizes & chart (${form.sizes.length})` },
    { id: "fit", label: "Fit AI" },
    { id: "seo", label: "SEO" },
  ];

  return (
    <div>
      {/* tabs */}
      <div className="no-scrollbar -mx-5 mb-7 flex gap-1.5 overflow-x-auto border-b border-silver-200 px-5 lg:mx-0 lg:px-0">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            className={cn(
              "shrink-0 border-b-2 px-3.5 py-3 text-[13px] transition-colors",
              tab === tb.id
                ? "border-ice-900 text-ice-950"
                : "border-transparent text-ice-600 hover:text-ice-900",
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ---------------- basics ---------------- */}
      {tab === "basics" && (
        <div className="space-y-7">
          <Card title="Identity">
            <div className="grid gap-5 sm:grid-cols-2">
              <Text
                label="Name (English)"
                value={form.name}
                error={errors.name}
                onChange={(v) => {
                  set("name", v);
                  if (!product && !form.slug) {
                    set(
                      "slug",
                      v
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    );
                  }
                }}
              />
              <Text
                label="الاسم (عربي)"
                value={form.name_ar ?? ""}
                onChange={(v) => set("name_ar", v)}
                dir="rtl"
              />
              <Text
                label="URL slug"
                value={form.slug}
                error={errors.slug}
                onChange={(v) => set("slug", v)}
                mono
                prefix="/product/"
              />
              <Text
                label="SKU"
                value={form.sku}
                error={errors.sku}
                onChange={(v) => set("sku", v)}
                mono
              />
              <Text
                label="Subtitle (English)"
                value={form.subtitle ?? ""}
                onChange={(v) => set("subtitle", v)}
              />
              <Text
                label="العنوان الفرعي (عربي)"
                value={form.subtitle_ar ?? ""}
                onChange={(v) => set("subtitle_ar", v)}
                dir="rtl"
              />
            </div>
          </Card>

          <Card title="Description">
            <div className="grid gap-5 lg:grid-cols-2">
              <Area
                label="Description (English)"
                value={form.description}
                onChange={(v) => set("description", v)}
                rows={6}
              />
              <Area
                label="الوصف (عربي)"
                value={form.description_ar ?? ""}
                onChange={(v) => set("description_ar", v)}
                rows={6}
                dir="rtl"
              />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <ListEditor
                label="Details (English)"
                items={form.details}
                onChange={(v) => set("details", v)}
              />
              <ListEditor
                label="التفاصيل (عربي)"
                items={form.details_ar ?? []}
                onChange={(v) => set("details_ar", v)}
                dir="rtl"
              />
            </div>
          </Card>

          <Card title="Pricing">
            <div className="grid gap-5 sm:grid-cols-3">
              <Text
                label="Price (EGP)"
                value={String(form.price || "")}
                error={errors.price}
                onChange={(v) => set("price", Number(v.replace(/[^\d]/g, "")) || 0)}
                inputMode="numeric"
              />
              <Text
                label="Compare-at price (EGP)"
                value={form.compare_at_price ? String(form.compare_at_price) : ""}
                onChange={(v) =>
                  set("compare_at_price", v ? Number(v.replace(/[^\d]/g, "")) || null : null)
                }
                inputMode="numeric"
                hint="Shown struck through. Leave empty for no discount."
              />
              <Text
                label="Popularity score"
                value={String(form.popularity ?? 0)}
                onChange={(v) => set("popularity", Number(v.replace(/[^\d]/g, "")) || 0)}
                inputMode="numeric"
                hint="Used by the 'Most popular' sort."
              />
            </div>
          </Card>

          <Card title="Organisation">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className={cn("field cursor-pointer", errors.category && "is-invalid")}
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="err">{errors.category}</span>}
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as Product["status"])}
                  className="field cursor-pointer"
                >
                  <option value="active">Active — visible in the shop</option>
                  <option value="draft">Draft — hidden from shoppers</option>
                  <option value="archived">Archived — removed from the shop</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <p className="label">Collections</p>
              <div className="flex flex-wrap gap-2">
                {curated.map((c) => {
                  const on = form.collections.includes(c.slug);
                  return (
                    <Chip
                      key={c.slug}
                      active={on}
                      onClick={() =>
                        set(
                          "collections",
                          on
                            ? form.collections.filter((s) => s !== c.slug)
                            : [...form.collections, c.slug],
                        )
                      }
                    >
                      {c.name}
                    </Chip>
                  );
                })}
              </div>
              <p className="mt-2 text-[11.5px] text-ice-500">
                New Arrivals, Best Sellers and Sale fill themselves from the badges below.
              </p>
            </div>

            <div className="mt-6">
              <p className="label">Badges</p>
              <div className="flex flex-wrap gap-2">
                {BADGES.map((b) => {
                  const on = form.badges.includes(b);
                  return (
                    <Chip
                      key={b}
                      active={on}
                      onClick={() =>
                        set("badges", on ? form.badges.filter((x) => x !== b) : [...form.badges, b])
                      }
                    >
                      {b}
                    </Chip>
                  );
                })}
              </div>
            </div>

            <label className="mt-6 flex cursor-pointer items-center gap-2.5 text-[13.5px]">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 accent-[var(--color-ice-900)]"
              />
              Feature on the homepage
            </label>
          </Card>

          <Card title="Colours">
            <ColorEditor colors={form.colors} onChange={(v) => set("colors", v)} />
          </Card>
        </div>
      )}

      {/* ---------------- media ---------------- */}
      {tab === "media" && (
        <Card
          title="Product photography"
          note="Upload the real photographs of this garment. Images are re-encoded for the web but never retouched — colour, cut and stitching stay exactly as shot."
        >
          <ImageUploader
            images={form.images as EditableImage[]}
            onChange={(next) => set("images", next as Product["images"])}
            folder="products"
          />
        </Card>
      )}

      {/* ---------------- sizes ---------------- */}
      {tab === "sizes" && (
        <div className="space-y-7">
          <Card
            title="Sizes, stock and this product's measurement chart"
            note="All measurements are in centimetres, taken flat on the real garment. These exact numbers drive the size chart shoppers see and the Fit AI recommendation — there is no universal chart."
          >
            {errors.sizes && (
              <p className="mb-4 rounded-md bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
                {errors.sizes}
              </p>
            )}

            {form.sizes.length === 0 ? (
              <p className="rounded-md border border-dashed border-silver-300 p-8 text-center text-[13.5px] text-ice-500">
                No sizes yet. Add the first one below.
              </p>
            ) : (
              <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[640px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-silver-200 text-start">
                      <Th className="w-24">Size</Th>
                      <Th className="w-20">Stock</Th>
                      {columns.map((c) => (
                        <Th key={String(c.key)} title={c.hint}>
                          {c.label}
                        </Th>
                      ))}
                      <Th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.sizes.map((row, i) => (
                      <tr key={i} className="border-b border-silver-100">
                        <Td>
                          <CellInput
                            value={row.size}
                            onChange={(v) => updateSize(i, { size: v })}
                            placeholder="M"
                          />
                        </Td>
                        <Td>
                          <CellInput
                            value={String(row.stock ?? 0)}
                            onChange={(v) =>
                              updateSize(i, { stock: Number(v.replace(/[^\d]/g, "")) || 0 })
                            }
                            numeric
                          />
                        </Td>
                        {columns.map((c) => (
                          <Td key={String(c.key)}>
                            <CellInput
                              value={row[c.key] == null ? "" : String(row[c.key])}
                              onChange={(v) =>
                                updateSize(i, {
                                  [c.key]: v === "" ? null : Number(v.replace(/[^\d.]/g, "")),
                                } as Partial<SizeRow>)
                              }
                              numeric
                              placeholder="—"
                            />
                          </Td>
                        ))}
                        <Td>
                          <button
                            type="button"
                            onClick={() => removeSize(i)}
                            aria-label={`Remove size ${row.size || i + 1}`}
                            className="grid h-8 w-8 place-items-center rounded-full text-ice-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                          </button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={addSize} className="btn btn-ghost !py-2.5 !text-[13px]">
                <Plus className="h-4 w-4" strokeWidth={2} />
                Add size
              </button>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] text-ice-500">Add column:</span>
                {MEASURES.filter((m) => !columns.some((c) => c.key === m.key)).map((m) => (
                  <button
                    key={String(m.key)}
                    type="button"
                    onClick={() => setExtraCols((c) => [...c, m.key])}
                    className="rounded-full bg-ice-50 px-2.5 py-1 text-[11.5px] text-ice-700 hover:bg-ice-100"
                  >
                    + {m.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Size note">
            <div className="grid gap-5 lg:grid-cols-2">
              <Area
                label="Note (English)"
                value={form.size_note ?? ""}
                onChange={(v) => set("size_note", v)}
                rows={3}
                hint="Appears under the size chart, e.g. 'Cut oversized — size down for a regular fit.'"
              />
              <Area
                label="ملاحظة المقاس (عربي)"
                value={form.size_note_ar ?? ""}
                onChange={(v) => set("size_note_ar", v)}
                rows={3}
                dir="rtl"
              />
            </div>
          </Card>
        </div>
      )}

      {/* ---------------- fit ---------------- */}
      {tab === "fit" && (
        <div className="space-y-7">
          {!fitEnabled && (
            <p className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-4 text-[13px] text-amber-900">
              <Info className="mt-px h-4 w-4 shrink-0" strokeWidth={1.6} />
              Fit AI is switched off globally in Settings, so it will not appear on any product page.
            </p>
          )}

          <Card
            title="How this garment is cut"
            note="Fit AI offsets its recommendation against the cut you declare here, then anchors on the body ranges in the chart below."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">Garment type</label>
                <select
                  value={form.garment_type}
                  onChange={(e) =>
                    set("garment_type", e.target.value as Product["garment_type"])
                  }
                  className="field cursor-pointer"
                >
                  <option value="top">Top — measured at the chest</option>
                  <option value="bottom">Bottom — measured at the waist</option>
                  <option value="set">Set — both</option>
                  <option value="accessory">Accessory — no sizing logic</option>
                  <option value="footwear">Footwear</option>
                </select>
              </div>
              <div>
                <label className="label">Intrinsic fit</label>
                <select
                  value={form.intrinsic_fit}
                  onChange={(e) =>
                    set("intrinsic_fit", e.target.value as Product["intrinsic_fit"])
                  }
                  className="field cursor-pointer"
                >
                  <option value="slim">Slim</option>
                  <option value="regular">Regular</option>
                  <option value="oversized">Oversized / relaxed</option>
                </select>
              </div>
            </div>
          </Card>

          <Card
            title="Body ranges per size"
            note="Optional but strongly recommended: the height and weight each size was graded for. When these are present Fit AI anchors on your grading instead of guessing from ease alone, and only then can it report high confidence."
          >
            {form.sizes.length === 0 ? (
              <p className="rounded-md border border-dashed border-silver-300 p-8 text-center text-[13.5px] text-ice-500">
                Add sizes first on the “Sizes & chart” tab.
              </p>
            ) : (
              <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[520px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-silver-200">
                      <Th className="w-24">Size</Th>
                      <Th>Height min (cm)</Th>
                      <Th>Height max (cm)</Th>
                      <Th>Weight min (kg)</Th>
                      <Th>Weight max (kg)</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.sizes.map((row, i) => (
                      <tr key={i} className="border-b border-silver-100">
                        <Td>
                          <span className="px-1 font-medium">{row.size || "—"}</span>
                        </Td>
                        {(
                          [
                            "bodyHeightMin",
                            "bodyHeightMax",
                            "bodyWeightMin",
                            "bodyWeightMax",
                          ] as (keyof SizeRow)[]
                        ).map((k) => (
                          <Td key={String(k)}>
                            <CellInput
                              value={row[k] == null ? "" : String(row[k])}
                              onChange={(v) =>
                                updateSize(i, {
                                  [k]: v === "" ? null : Number(v.replace(/[^\d.]/g, "")),
                                } as Partial<SizeRow>)
                              }
                              numeric
                              placeholder="—"
                            />
                          </Td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ---------------- seo ---------------- */}
      {tab === "seo" && (
        <Card title="Search engine listing">
          <div className="grid gap-5">
            <Text
              label="SEO title"
              value={form.seo_title ?? ""}
              onChange={(v) => set("seo_title", v)}
              hint="Leave empty to use the product name."
            />
            <Area
              label="SEO description"
              value={form.seo_description ?? ""}
              onChange={(v) => set("seo_description", v)}
              rows={3}
              hint="Around 150 characters. Leave empty to use the product description."
            />
          </div>
        </Card>
      )}

      {/* ---------------- actions ---------------- */}
      <div className="sticky bottom-0 z-10 mt-8 flex flex-wrap items-center gap-3 border-t border-silver-200 bg-white/92 py-4 backdrop-blur">
        <button type="button" onClick={save} disabled={busy} className="btn btn-primary">
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Save className="h-4 w-4" strokeWidth={1.75} />
          )}
          {product ? "Save changes" : "Create product"}
        </button>

        {product && product.status !== "archived" && (
          <button type="button" onClick={archive} disabled={busy} className="btn btn-ghost">
            <Archive className="h-4 w-4" strokeWidth={1.6} />
            Archive
          </button>
        )}

        <p className="text-[12px] text-ice-500">
          Changes are written straight to the connected database.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Small building blocks
 * ------------------------------------------------------------------ */

function Card({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-silver-200 bg-white p-5 sm:p-6">
      <h2 className="font-display text-[15px] uppercase tracking-tight">{title}</h2>
      {note && <p className="mt-1.5 max-w-3xl text-[12.5px] leading-relaxed text-ice-600">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Text({
  label,
  value,
  onChange,
  error,
  hint,
  mono,
  prefix,
  dir,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  mono?: boolean;
  prefix?: string;
  dir?: "rtl" | "ltr";
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="pointer-events-none absolute start-3.5 font-mono text-[12px] text-ice-400">
            {prefix}
          </span>
        )}
        <input
          value={value}
          dir={dir}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn("field", mono && "font-mono", error && "is-invalid")}
          style={prefix ? { paddingInlineStart: `${prefix.length * 7 + 18}px` } : undefined}
        />
      </div>
      {error ? <span className="err">{error}</span> : hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 4,
  hint,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        value={value}
        dir={dir}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="field resize-y"
      />
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="mt-1.5 block text-[11.5px] leading-snug text-ice-500">{children}</span>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[12.5px] capitalize transition-colors",
        active
          ? "bg-ice-900 text-white"
          : "bg-ice-50 text-ice-700 ring-1 ring-inset ring-silver-200 hover:bg-ice-100",
      )}
    >
      {children}
    </button>
  );
}

function Th({
  children,
  className,
  title,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <th
      title={title}
      className={cn(
        "px-1.5 pb-2.5 text-start text-[11px] font-medium uppercase tracking-[0.08em] text-ice-500",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-1.5 py-1.5 align-middle">{children}</td>;
}

function CellInput({
  value,
  onChange,
  placeholder,
  numeric,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      inputMode={numeric ? "decimal" : "text"}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 w-full rounded-md border border-silver-200 bg-white px-2.5 text-[13px] outline-none transition-colors placeholder:text-ice-300 focus:border-ice-500 focus:bg-ice-50/40",
        numeric && "tabular-nums",
      )}
    />
  );
}

function ListEditor({
  label,
  items,
  onChange,
  dir,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <input
              value={item}
              dir={dir}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              className="field"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label="Remove"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-ice-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.6} />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-ice-700 hover:text-ice-950"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        Add line
      </button>
    </div>
  );
}

function ColorEditor({
  colors,
  onChange,
}: {
  colors: Product["colors"];
  onChange: (next: Product["colors"]) => void;
}) {
  return (
    <div>
      <ul className="space-y-3">
        {colors.map((c, i) => (
          <li key={i} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px] flex-1">
              <label className="label">Name</label>
              <input
                value={c.name}
                onChange={(e) =>
                  onChange(colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                }
                className="field"
              />
            </div>
            <div className="min-w-[160px] flex-1">
              <label className="label">الاسم (عربي)</label>
              <input
                value={c.name_ar ?? ""}
                dir="rtl"
                onChange={(e) =>
                  onChange(colors.map((x, j) => (j === i ? { ...x, name_ar: e.target.value } : x)))
                }
                className="field"
              />
            </div>
            <div>
              <label className="label">Swatch</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) =>
                    onChange(colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))
                  }
                  className="h-11 w-14 cursor-pointer rounded-md border border-silver-200 bg-white p-1"
                />
                <code className="text-[12px] text-ice-600">{c.hex}</code>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange(colors.filter((_, j) => j !== i))}
              aria-label="Remove colour"
              className="grid h-11 w-11 place-items-center rounded-md text-ice-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.6} />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange([...colors, { name: "", hex: "#2b2f3a" }])}
        className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-ice-700 hover:text-ice-950"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        Add colour
      </button>
    </div>
  );
}
