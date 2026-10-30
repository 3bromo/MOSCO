"use client";

import { useState } from "react";
import { Check, Loader2, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import type { Address } from "@/lib/db/types";
import { useI18n } from "@/lib/i18n/context";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

type Draft = Omit<Address, "id"> & { id?: string };

const EMPTY: Draft = { label: "", city: "", address: "", notes: "", is_default: false };

export default function AddressBook({
  initial,
  cities,
}: {
  initial: Address[];
  cities: { city: string; city_ar?: string }[];
}) {
  const { t, locale } = useI18n();
  const toast = useUI((s) => s.toast);

  const [addresses, setAddresses] = useState<Address[]>(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const call = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      if (Array.isArray(data.addresses)) setAddresses(data.addresses);
      return true;
    } catch {
      toast(t("common.somethingWrong"), "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    const next: Record<string, string> = {};
    if (!draft.label.trim()) next.label = t("auth.required");
    if (!draft.city.trim()) next.city = t("checkout.errCity");
    if (draft.address.trim().length < 8) next.address = t("checkout.errAddress");
    setErrors(next);
    if (Object.keys(next).length) return;

    const ok = await call({ action: "address_save", address: draft });
    if (ok) {
      setDraft(null);
      toast(t("account.updated"), "success");
    }
  };

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !draft && (
        <div className="rounded-lg border border-dashed border-silver-300 p-10 text-center">
          <MapPin className="mx-auto h-7 w-7 text-ice-400" strokeWidth={1.25} />
          <p className="mt-3 text-[14px] text-ice-600">{t("account.addAddress")}</p>
        </div>
      )}

      <ul className="space-y-3">
        {addresses.map((a) => (
          <li
            key={a.id}
            className={cn(
              "rounded-lg border bg-white p-5 transition-colors",
              a.is_default ? "border-ice-500 ring-1 ring-ice-200" : "border-silver-200",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium">
                  {a.label}
                  {a.is_default && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ice-100 px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-ice-800">
                      <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
                      {t("account.defaultAddress")}
                    </span>
                  )}
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ice-700">
                  {a.address}
                  <span className="block text-ice-500">{a.city}</span>
                </p>
                {a.notes && <p className="mt-1 text-[12.5px] text-ice-500">{a.notes}</p>}
              </div>

              <div className="flex shrink-0 gap-1">
                {!a.is_default && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => call({ action: "address_default", id: a.id })}
                    title={t("account.setDefault")}
                    className="grid h-9 w-9 place-items-center rounded-full text-ice-500 hover:bg-ice-100 hover:text-ice-900"
                  >
                    <Star className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ ...a });
                    setErrors({});
                  }}
                  title={t("common.edit")}
                  className="grid h-9 w-9 place-items-center rounded-full text-ice-500 hover:bg-ice-100 hover:text-ice-900"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => call({ action: "address_delete", id: a.id })}
                  title={t("common.delete")}
                  className="grid h-9 w-9 place-items-center rounded-full text-ice-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {draft ? (
        <div className="rounded-lg border border-ice-400 bg-ice-50/60 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="a_label">
                {t("account.addresses")}
              </label>
              <input
                id="a_label"
                value={draft.label}
                placeholder={"en" ? "المنزل / العمل" : "Home / Work"}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                aria-invalid={Boolean(errors.label)}
                className={cn("field", errors.label && "is-invalid")}
              />
              {errors.label && <span className="err">{errors.label}</span>}
            </div>

            <div>
              <label className="label" htmlFor="a_city">
                {t("checkout.city")}
              </label>
              <select
                id="a_city"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                aria-invalid={Boolean(errors.city)}
                className={cn("field cursor-pointer", errors.city && "is-invalid")}
              >
                <option value="">{t("checkout.selectCity")}</option>
                {cities.map((c) => (
                  <option key={c.city} value={c.city}>
                    {"en" && c.city_ar ? c.city_ar : c.city}
                  </option>
                ))}
              </select>
              {errors.city && <span className="err">{errors.city}</span>}
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="a_address">
                {t("checkout.address")}
              </label>
              <textarea
                id="a_address"
                rows={2}
                value={draft.address}
                placeholder={t("checkout.addressPh")}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                aria-invalid={Boolean(errors.address)}
                className={cn("field resize-y", errors.address && "is-invalid")}
              />
              {errors.address && <span className="err">{errors.address}</span>}
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] sm:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(draft.is_default)}
                onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-ice-900)]"
              />
              {t("account.setDefault")}
            </label>
          </div>

          <div className="mt-5 flex gap-2">
            <button type="button" onClick={save} disabled={busy} className="btn btn-primary">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <>
                  <Check className="h-4 w-4" strokeWidth={2} />
                  {t("common.save")}
                </>
              )}
            </button>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost">
              <X className="h-4 w-4" strokeWidth={1.75} />
              {t("common.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft({ ...EMPTY });
            setErrors({});
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-silver-300 px-4 py-4 text-[13.5px] text-ice-700 transition-colors hover:border-ice-500 hover:bg-ice-50/60"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          {t("account.addAddress")}
        </button>
      )}
    </div>
  );
}
