"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import type { Collection } from "@/lib/db/types";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

type Row = Collection & { count: number };
type Draft = Partial<Collection> & { slug: string; name: string };

const BLANK: Draft = {
  slug: "",
  name: "",
  name_ar: "",
  description: "",
  description_ar: "",
  image: null,
  kind: "collection",
  position: 10,
  featured: false,
  visible: true,
  auto_badge: null,
};

export default function CollectionManager({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const toast = useUI((s) => s.toast);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!draft) return;
    const e: Record<string, string> = {};
    if (!draft.name?.trim()) e.name = "Required";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug.trim())) e.slug = "lowercase-with-dashes";
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...BLANK,
          ...draft,
          position: Number(draft.position ?? 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields?.slug === "slug_taken") setErrors({ slug: "Already used" });
        else toast("Could not save.", "error");
        return;
      }
      toast("Collection saved.", "success");
      setDraft(null);
      router.refresh();
    } catch {
      toast("Could not save.", "error");
    } finally {
      setBusy(false);
    }
  };

  const toggleVisible = async (row: Row) => {
    setBusy(true);
    try {
      await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...row, visible: !row.visible }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: Row) => {
    if (row.count > 0) {
      toast(`${row.count} product(s) still reference this collection.`, "info");
    }
    setBusy(true);
    try {
      await fetch("/api/admin/collections", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      toast("Collection deleted.", "success");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const groups: { title: string; kind: Collection["kind"] }[] = [
    { title: "Categories", kind: "category" },
    { title: "Curated collections", kind: "collection" },
  ];

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.kind}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] uppercase tracking-tight">{g.title}</h2>
            <button
              type="button"
              onClick={() => {
                setDraft({ ...BLANK, kind: g.kind });
                setErrors({});
              }}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-ice-700 hover:text-ice-950"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Add
            </button>
          </div>

          <ul className="divide-y divide-silver-200 overflow-hidden rounded-lg border border-silver-200 bg-white">
            {initial
              .filter((c) => c.kind === g.kind)
              .map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                  <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded bg-ice-100">
                    {c.image ? (
                      <Image src={c.image} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[9px] uppercase tracking-wider text-ice-400">
                        No image
                      </span>
                    )}
                  </div>

                  <div className="min-w-[160px] flex-1">
                    <p className="text-[13.5px] font-medium">{c.name}</p>
                    <p className="font-mono text-[11px] text-ice-500">/{c.slug}</p>
                  </div>

                  {c.auto_badge && (
                    <span className="rounded-full bg-ice-50 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.08em] text-ice-600 ring-1 ring-inset ring-ice-200">
                      auto · {c.auto_badge}
                    </span>
                  )}

                  <span className="text-[12.5px] tabular-nums text-ice-600">
                    {c.count} product{c.count === 1 ? "" : "s"}
                  </span>

                  <div className="flex shrink-0 gap-1">
                    <IconBtn
                      onClick={() => toggleVisible(c)}
                      label={c.visible ? "Hide" : "Show"}
                      disabled={busy}
                    >
                      {c.visible ? (
                        <Eye className="h-4 w-4" strokeWidth={1.5} />
                      ) : (
                        <EyeOff className="h-4 w-4 text-ice-400" strokeWidth={1.5} />
                      )}
                    </IconBtn>
                    <IconBtn
                      onClick={() => {
                        setDraft({ ...c });
                        setErrors({});
                      }}
                      label="Edit"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    </IconBtn>
                    <IconBtn onClick={() => remove(c)} label="Delete" danger disabled={busy}>
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </IconBtn>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}

      {draft && (
        <section className="rounded-lg border border-ice-400 bg-ice-50/60 p-5 sm:p-6">
          <h2 className="font-display text-[15px] uppercase tracking-tight">
            {draft.id ? "Edit collection" : "New collection"}
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Name (English)" error={errors.name}>
              <input
                value={draft.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setDraft({
                    ...draft,
                    name,
                    slug:
                      draft.id || draft.slug
                        ? draft.slug
                        : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                  });
                }}
                className={cn("field", errors.name && "is-invalid")}
              />
            </Field>
            <Field label="الاسم (عربي)">
              <input
                value={draft.name_ar ?? ""}
                dir="rtl"
                onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })}
                className="field"
              />
            </Field>
            <Field label="URL slug" error={errors.slug}>
              <input
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                className={cn("field font-mono", errors.slug && "is-invalid")}
              />
            </Field>
            <Field label="Sort position">
              <input
                value={String(draft.position ?? 10)}
                inputMode="numeric"
                onChange={(e) =>
                  setDraft({ ...draft, position: Number(e.target.value.replace(/\D/g, "")) || 0 })
                }
                className="field"
              />
            </Field>
            <Field label="Description (English)">
              <textarea
                value={draft.description ?? ""}
                rows={2}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="field resize-y"
              />
            </Field>
            <Field label="الوصف (عربي)">
              <textarea
                value={draft.description_ar ?? ""}
                rows={2}
                dir="rtl"
                onChange={(e) => setDraft({ ...draft, description_ar: e.target.value })}
                className="field resize-y"
              />
            </Field>
            <Field label="Type">
              <select
                value={draft.kind}
                onChange={(e) =>
                  setDraft({ ...draft, kind: e.target.value as Collection["kind"] })
                }
                className="field cursor-pointer"
              >
                <option value="category">Category — shop navigation</option>
                <option value="collection">Curated collection</option>
              </select>
            </Field>
            <Field label="Auto-fill from badge">
              <select
                value={draft.auto_badge ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    auto_badge: (e.target.value || null) as Collection["auto_badge"],
                  })
                }
                className="field cursor-pointer"
              >
                <option value="">Manual — products opt in</option>
                <option value="new">Every product badged “new”</option>
                <option value="bestseller">Every product badged “bestseller”</option>
                <option value="sale">Every product badged “sale”</option>
                <option value="limited">Every product badged “limited”</option>
              </select>
            </Field>
          </div>

          <div className="mt-5">
            <p className="label">Cover image</p>
            <ImageUploader
              images={draft.image ? [{ url: draft.image, alt: draft.name, position: 0 }] : []}
              onChange={(next) => setDraft({ ...draft, image: next[0]?.url ?? null })}
              folder="banners"
              max={1}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-5">
            <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px]">
              <input
                type="checkbox"
                checked={draft.visible ?? true}
                onChange={(e) => setDraft({ ...draft, visible: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-ice-900)]"
              />
              Visible on the site
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px]">
              <input
                type="checkbox"
                checked={draft.featured ?? false}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-ice-900)]"
              />
              Feature on the homepage
            </label>
          </div>

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={save} disabled={busy} className="btn btn-primary">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <Check className="h-4 w-4" strokeWidth={2} />
              )}
              Save
            </button>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost">
              <X className="h-4 w-4" strokeWidth={1.75} />
              Cancel
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full text-ice-500 transition-colors disabled:opacity-40",
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-ice-100 hover:text-ice-900",
      )}
    >
      {children}
    </button>
  );
}
