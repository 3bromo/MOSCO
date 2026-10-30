"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Info, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Settings } from "@/lib/db/types";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

type Tab = "store" | "shipping" | "payments" | "fit";

export default function SettingsEditor({
  settings,
  mode,
}: {
  settings: Settings;
  mode: "local" | "supabase";
}) {
  const router = useRouter();
  const toast = useUI((s) => s.toast);

  const [tab, setTab] = useState<Tab>("store");
  const [form, setForm] = useState({
    brand_name: settings.brand_name,
    tagline: settings.tagline,
    tagline_ar: settings.tagline_ar ?? "",
    contact_email: settings.contact_email,
    contact_phone: settings.contact_phone,
    whatsapp: settings.whatsapp ?? "",
    instagram: settings.instagram ?? "",
    tiktok: settings.tiktok ?? "",
    address_line: settings.address_line ?? "",
    address_line_ar: settings.address_line_ar ?? "",
    shipping_flat: settings.shipping_flat,
    free_shipping_threshold: settings.free_shipping_threshold,
    instapay_handle: settings.instapay_handle,
    instapay_name: settings.instapay_name,
    instapay_instructions: settings.instapay_instructions,
    instapay_instructions_ar: settings.instapay_instructions_ar ?? "",
  });
  const [rates, setRates] = useState(settings.shipping_rates);
  const [fit, setFit] = useState(settings.fit_ai);
  const [busy, setBusy] = useState(false);

  type Form = typeof form;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          shipping_flat: Number(form.shipping_flat) || 0,
          free_shipping_threshold: Number(form.free_shipping_threshold) || 0,
          shipping_rates: rates.map((r) => ({ ...r, cost: Number(r.cost) || 0 })),
          fit_ai: {
            ...fit,
            ease_slim: Number(fit.ease_slim),
            ease_regular: Number(fit.ease_regular),
            ease_oversized: Number(fit.ease_oversized),
            tolerance: Number(fit.tolerance),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.fields ? "Check the highlighted values." : "Could not save.", "error");
        return;
      }
      toast("Settings saved.", "success");
      router.refresh();
    } catch {
      toast("Could not save.", "error");
    } finally {
      setBusy(false);
    }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "store", label: "Store" },
    { id: "shipping", label: `Shipping (${rates.length})` },
    { id: "payments", label: "Payments" },
    { id: "fit", label: "Fit AI" },
  ];

  return (
    <div>
      <div className="no-scrollbar -mx-5 mb-7 flex gap-1.5 overflow-x-auto border-b border-silver-200 px-5 lg:mx-0 lg:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 border-b-2 px-3.5 py-3 text-[13px] transition-colors",
              tab === t.id
                ? "border-ice-900 text-ice-950"
                : "border-transparent text-ice-600 hover:text-ice-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "store" && (
        <div className="space-y-7">
          <Card title="Brand">
            <div className="grid gap-5 sm:grid-cols-2">
              <Text label="Brand name" value={form.brand_name} onChange={(v) => set("brand_name", v)} />
              <Text label="Tagline (English)" value={form.tagline} onChange={(v) => set("tagline", v)} />
              <Text label="الشعار (عربي)" value={form.tagline_ar} onChange={(v) => set("tagline_ar", v)} dir="rtl" />
            </div>
          </Card>

          <Card title="Contact">
            <div className="grid gap-5 sm:grid-cols-2">
              <Text label="Email" value={form.contact_email} onChange={(v) => set("contact_email", v)} ltr />
              <Text label="Phone" value={form.contact_phone} onChange={(v) => set("contact_phone", v)} ltr />
              <Text label="WhatsApp number" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} ltr hint="Digits with country code, e.g. 201234567890" />
              <Text label="Instagram handle" value={form.instagram} onChange={(v) => set("instagram", v)} ltr />
              <Text label="TikTok handle" value={form.tiktok} onChange={(v) => set("tiktok", v)} ltr />
              <Text label="Address (English)" value={form.address_line} onChange={(v) => set("address_line", v)} />
              <Text label="العنوان (عربي)" value={form.address_line_ar} onChange={(v) => set("address_line_ar", v)} dir="rtl" />
            </div>
          </Card>

          <Card title="Database">
            <div className="flex items-start gap-3 rounded-md bg-ice-50 p-4">
              <Database className="mt-0.5 h-4 w-4 shrink-0 text-ice-700" strokeWidth={1.6} />
              <div className="text-[13px] leading-relaxed text-ice-700">
                {mode === "supabase" ? (
                  <>
                    Connected to <strong>Supabase</strong>. All reads and writes go to your project,
                    using the service-role key on the server only.
                  </>
                ) : (
                  <>
                    Running on the <strong>local JSON database</strong> at{" "}
                    <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[12px]">
                      data/mosco.json
                    </code>
                    . Add <code className="font-mono text-[12px]">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                    <code className="font-mono text-[12px]">SUPABASE_SERVICE_ROLE_KEY</code> to
                    <code className="font-mono text-[12px]"> .env.local</code> and restart to switch
                    — no code changes needed. Run{" "}
                    <code className="font-mono text-[12px]">supabase/schema.sql</code> first.
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "shipping" && (
        <div className="space-y-7">
          <Card title="Defaults">
            <div className="grid gap-5 sm:grid-cols-2">
              <Text
                label="Flat shipping rate (EGP)"
                value={String(form.shipping_flat)}
                onChange={(v) => set("shipping_flat", Number(v.replace(/\D/g, "")) || 0)}
                hint="Used for any city without its own rate below."
              />
              <Text
                label="Free shipping above (EGP)"
                value={String(form.free_shipping_threshold)}
                onChange={(v) => set("free_shipping_threshold", Number(v.replace(/\D/g, "")) || 0)}
                hint="Set to 0 to disable free shipping."
              />
            </div>
          </Card>

          <Card title="Rate per governorate" note="These are the cities shown in the checkout dropdown.">
            <ul className="space-y-2">
              {rates.map((r, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    value={r.city}
                    onChange={(e) =>
                      setRates(rates.map((x, j) => (j === i ? { ...x, city: e.target.value } : x)))
                    }
                    placeholder="City (English)"
                    className="field flex-1 !min-w-[140px]"
                  />
                  <input
                    value={r.city_ar ?? ""}
                    dir="rtl"
                    onChange={(e) =>
                      setRates(rates.map((x, j) => (j === i ? { ...x, city_ar: e.target.value } : x)))
                    }
                    placeholder="المحافظة"
                    className="field flex-1 !min-w-[140px]"
                  />
                  <input
                    value={String(r.cost)}
                    inputMode="numeric"
                    onChange={(e) =>
                      setRates(
                        rates.map((x, j) =>
                          j === i ? { ...x, cost: Number(e.target.value.replace(/\D/g, "")) || 0 } : x,
                        ),
                      )
                    }
                    className="field !w-28 tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setRates(rates.filter((_, j) => j !== i))}
                    aria-label={`Remove ${r.city}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-ice-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setRates([...rates, { city: "", city_ar: "", cost: form.shipping_flat }])}
              className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-ice-700 hover:text-ice-950"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Add governorate
            </button>
          </Card>
        </div>
      )}

      {tab === "payments" && (
        <Card
          title="InstaPay"
          note="Shown to the customer the moment they choose InstaPay at checkout, together with the exact amount owed."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Text label="InstaPay handle / address" value={form.instapay_handle} onChange={(v) => set("instapay_handle", v)} ltr mono />
            <Text label="Account name" value={form.instapay_name} onChange={(v) => set("instapay_name", v)} />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Area label="Instructions (English)" value={form.instapay_instructions} onChange={(v) => set("instapay_instructions", v)} rows={5} />
            <Area label="التعليمات (عربي)" value={form.instapay_instructions_ar} onChange={(v) => set("instapay_instructions_ar", v)} rows={5} dir="rtl" />
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-md bg-ice-50 p-3.5 text-[12.5px] text-ice-700">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
            Cash on delivery is always available and needs no configuration. Customers paying by
            InstaPay must upload a transfer screenshot before the order can be submitted.
          </p>
        </Card>
      )}

      {tab === "fit" && (
        <div className="space-y-7">
          <Card title="MOSCOW Fit AI">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={fit.enabled}
                onChange={(e) => setFit({ ...fit, enabled: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-[var(--color-ice-900)]"
              />
              <span>
                <span className="block text-[13.5px] font-medium">Show Fit AI on product pages</span>
                <span className="mt-0.5 block text-[12px] text-ice-600">
                  Three questions only: height &amp; weight, body shape, preferred fit. It never adds
                  to the cart — the customer selects the size themselves.
                </span>
              </span>
            </label>

            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={fit.show_confidence}
                onChange={(e) => setFit({ ...fit, show_confidence: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-[var(--color-ice-900)]"
              />
              <span>
                <span className="block text-[13.5px] font-medium">Show the confidence indicator</span>
                <span className="mt-0.5 block text-[12px] text-ice-600">
                  High confidence is only ever reported when the product publishes body ranges for
                  its sizes.
                </span>
              </span>
            </label>
          </Card>

          <Card
            title="Ease targets"
            note="Centimetres of room added around the body for each preference. Bottoms use 45% of these values. Changing them shifts every recommendation site-wide, so move in small steps."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Text label="Slim ease (cm)" value={String(fit.ease_slim)} onChange={(v) => setFit({ ...fit, ease_slim: Number(v.replace(/[^\d.]/g, "")) || 0 })} />
              <Text label="Regular ease (cm)" value={String(fit.ease_regular)} onChange={(v) => setFit({ ...fit, ease_regular: Number(v.replace(/[^\d.]/g, "")) || 0 })} />
              <Text label="Oversized ease (cm)" value={String(fit.ease_oversized)} onChange={(v) => setFit({ ...fit, ease_oversized: Number(v.replace(/[^\d.]/g, "")) || 0 })} />
              <Text label="Tolerance (cm)" value={String(fit.tolerance)} onChange={(v) => setFit({ ...fit, tolerance: Number(v.replace(/[^\d.]/g, "")) || 0 })} hint="Slack before confidence drops." />
            </div>
          </Card>

          <Card title="Disclaimer" note="Always shown under the recommendation.">
            <div className="grid gap-5 lg:grid-cols-2">
              <Area label="Disclaimer (English)" value={fit.disclaimer ?? ""} onChange={(v) => setFit({ ...fit, disclaimer: v })} rows={3} />
              <Area label="إخلاء المسؤولية (عربي)" value={fit.disclaimer_ar ?? ""} onChange={(v) => setFit({ ...fit, disclaimer_ar: v })} rows={3} dir="rtl" />
            </div>
          </Card>
        </div>
      )}

      <div className="sticky bottom-0 z-10 mt-8 flex items-center gap-3 border-t border-silver-200 bg-white/92 py-4 backdrop-blur">
        <button type="button" onClick={save} disabled={busy} className="btn btn-primary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Save className="h-4 w-4" strokeWidth={1.75} />}
          Save settings
        </button>
      </div>
    </div>
  );
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
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
  hint,
  dir,
  ltr,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  dir?: "rtl" | "ltr";
  ltr?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        value={value}
        dir={ltr ? "ltr" : dir}
        onChange={(e) => onChange(e.target.value)}
        className={cn("field", mono && "font-mono")}
      />
      {hint && <span className="mt-1.5 block text-[11.5px] leading-snug text-ice-500">{hint}</span>}
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 4,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea value={value} rows={rows} dir={dir} onChange={(e) => onChange(e.target.value)} className="field resize-y" />
    </div>
  );
}
