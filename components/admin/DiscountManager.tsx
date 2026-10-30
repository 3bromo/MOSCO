"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Discount } from "@/lib/db/types";
import { formatMoney } from "@/lib/money";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

type Draft = Partial<Discount> & { code: string };

const BLANK: Draft = {
  code: "",
  type: "percent",
  value: 10,
  min_subtotal: 0,
  active: true,
  usage_limit: null,
  expires_at: null,
};

export default function DiscountManager({ initial }: { initial: Discount[] }) {
  const router = useRouter();
  const toast = useUI((s) => s.toast);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!draft) return;
    const e: Record<string, string> = {};
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(draft.code.trim())) e.code = "3–32 letters, digits, - or _";
    if (draft.type !== "free_shipping" && !(Number(draft.value) > 0)) e.value = "Must be above 0";
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...BLANK,
          ...draft,
          value: Number(draft.value) || 0,
          min_subtotal: Number(draft.min_subtotal) || 0,
          usage_limit: draft.usage_limit ? Number(draft.usage_limit) : null,
          expires_at: draft.expires_at || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields?.code === "code_taken") setErrors({ code: "Already in use" });
        else toast("Could not save.", "error");
        return;
      }
      toast("Discount saved.", "success");
      setDraft(null);
      router.refresh();
    } catch {
      toast("Could not save.", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await fetch("/api/admin/discounts", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      toast("Discount deleted.", "success");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const describe = (d: Discount) =>
    d.type === "percent"
      ? `${d.value}% off`
      : d.type === "fixed"
        ? `${formatMoney(d.value, "en")} off`
        : "Free shipping";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setDraft({ ...BLANK });
            setErrors({});
          }}
          className="btn btn-primary !py-2.5 !text-[13px]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          New code
        </button>
      </div>

      {initial.length === 0 ? (
        <div className="rounded-lg border border-dashed border-silver-300 p-12 text-center">
          <p className="text-[13.5px] text-ice-600">No discount codes yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-silver-200 overflow-hidden rounded-lg border border-silver-200 bg-white">
          {initial.map((d) => {
            const expired = d.expires_at ? new Date(d.expires_at).getTime() < Date.now() : false;
            const exhausted = d.usage_limit != null && d.used >= d.usage_limit;
            const live = d.active && !expired && !exhausted;

            return (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <code className="rounded bg-ice-50 px-2.5 py-1 font-mono text-[13px] font-medium">
                  {d.code}
                </code>
                <span className="text-[13px] text-ice-700">{describe(d)}</span>
                {d.min_subtotal > 0 && (
                  <span className="text-[12px] text-ice-500">
                    over {formatMoney(d.min_subtotal, "en")}
                  </span>
                )}
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10.5px] uppercase tracking-[0.08em] ring-1 ring-inset",
                    live
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-ice-100 text-ice-500 ring-ice-200",
                  )}
                >
                  {live ? "live" : expired ? "expired" : exhausted ? "used up" : "paused"}
                </span>
                <span className="text-[12px] tabular-nums text-ice-500">
                  used {d.used}
                  {d.usage_limit != null ? ` / ${d.usage_limit}` : ""}
                </span>

                <div className="ms-auto flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft({ ...d });
                      setErrors({});
                    }}
                    aria-label="Edit"
                    className="grid h-9 w-9 place-items-center rounded-full text-ice-500 hover:bg-ice-100 hover:text-ice-900"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(d.id)}
                    disabled={busy}
                    aria-label="Delete"
                    className="grid h-9 w-9 place-items-center rounded-full text-ice-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {draft && (
        <section className="rounded-lg border border-ice-400 bg-ice-50/60 p-5 sm:p-6">
          <h2 className="font-display text-[15px] uppercase tracking-tight">
            {draft.id ? "Edit code" : "New code"}
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label">Code</label>
              <input
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                className={cn("field font-mono uppercase", errors.code && "is-invalid")}
              />
              {errors.code && <span className="err">{errors.code}</span>}
            </div>

            <div>
              <label className="label">Type</label>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as Discount["type"] })}
                className="field cursor-pointer"
              >
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off (EGP)</option>
                <option value="free_shipping">Free shipping</option>
              </select>
            </div>

            {draft.type !== "free_shipping" && (
              <div>
                <label className="label">
                  {draft.type === "percent" ? "Percent" : "Amount (EGP)"}
                </label>
                <input
                  value={String(draft.value ?? "")}
                  inputMode="numeric"
                  onChange={(e) =>
                    setDraft({ ...draft, value: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })
                  }
                  className={cn("field", errors.value && "is-invalid")}
                />
                {errors.value && <span className="err">{errors.value}</span>}
              </div>
            )}

            <div>
              <label className="label">Minimum subtotal (EGP)</label>
              <input
                value={String(draft.min_subtotal ?? 0)}
                inputMode="numeric"
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    min_subtotal: Number(e.target.value.replace(/\D/g, "")) || 0,
                  })
                }
                className="field"
              />
            </div>

            <div>
              <label className="label">Usage limit</label>
              <input
                value={draft.usage_limit == null ? "" : String(draft.usage_limit)}
                inputMode="numeric"
                placeholder="Unlimited"
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setDraft({ ...draft, usage_limit: v ? Number(v) : null });
                }}
                className="field"
              />
            </div>

            <div>
              <label className="label">Expires</label>
              <input
                type="date"
                value={draft.expires_at ? draft.expires_at.slice(0, 10) : ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className="field cursor-pointer"
              />
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-[13.5px]">
            <input
              type="checkbox"
              checked={draft.active ?? true}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-ice-900)]"
            />
            Active
          </label>

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
