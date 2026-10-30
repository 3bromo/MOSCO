"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Plus, Save, Trash2 } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import type { Banner, Settings } from "@/lib/db/types";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

export default function ContentEditor({ settings }: { settings: Settings }) {
  const router = useRouter();
  const toast = useUI((s) => s.toast);

  const [form, setForm] = useState({
    home_hero_title: settings.home_hero_title,
    home_hero_title_ar: settings.home_hero_title_ar ?? "",
    home_hero_sub: settings.home_hero_sub,
    home_hero_sub_ar: settings.home_hero_sub_ar ?? "",
    home_story_title: settings.home_story_title,
    home_story_title_ar: settings.home_story_title_ar ?? "",
    home_story_body: settings.home_story_body,
    home_story_body_ar: settings.home_story_body_ar ?? "",
    home_story_image: settings.home_story_image ?? null,
    about_body: settings.about_body ?? "",
    about_body_ar: settings.about_body_ar ?? "",
  });
  const [banners, setBanners] = useState<Banner[]>(settings.banners);
  const [busy, setBusy] = useState(false);

  type Form = typeof form;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, banners }),
      });
      if (!res.ok) throw new Error();
      toast("Homepage content saved.", "success");
      router.refresh();
    } catch {
      toast("Could not save.", "error");
    } finally {
      setBusy(false);
    }
  };

  const updateBanner = (id: string, patch: Partial<Banner>) =>
    setBanners((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const addBanner = (placement: Banner["placement"]) =>
    setBanners((b) => [
      ...b,
      {
        id: `bn_${Date.now().toString(36)}`,
        title: "",
        subtitle: "",
        image: null,
        cta_label: "",
        cta_href: "/shop",
        position: b.length,
        visible: true,
        placement,
      },
    ]);

  return (
    <div className="space-y-7">
      <Card title="Hero" note="The headline over the 3D scene on the homepage.">
        <div className="grid gap-5 lg:grid-cols-2">
          <Text label="Hero title (English)" value={form.home_hero_title} onChange={(v) => set("home_hero_title", v)} />
          <Text label="عنوان الواجهة (عربي)" value={form.home_hero_title_ar} onChange={(v) => set("home_hero_title_ar", v)} dir="rtl" />
          <Area label="Hero subtitle (English)" value={form.home_hero_sub} onChange={(v) => set("home_hero_sub", v)} rows={2} />
          <Area label="النص الفرعي (عربي)" value={form.home_hero_sub_ar} onChange={(v) => set("home_hero_sub_ar", v)} rows={2} dir="rtl" />
        </div>
      </Card>

      <Card title="Brand story block">
        <div className="grid gap-5 lg:grid-cols-2">
          <Text label="Story title (English)" value={form.home_story_title} onChange={(v) => set("home_story_title", v)} />
          <Text label="عنوان القصة (عربي)" value={form.home_story_title_ar} onChange={(v) => set("home_story_title_ar", v)} dir="rtl" />
          <Area label="Story body (English)" value={form.home_story_body} onChange={(v) => set("home_story_body", v)} rows={5} />
          <Area label="نص القصة (عربي)" value={form.home_story_body_ar} onChange={(v) => set("home_story_body_ar", v)} rows={5} dir="rtl" />
        </div>

        <div className="mt-6">
          <p className="label">Story image</p>
          <ImageUploader
            images={form.home_story_image ? [{ url: form.home_story_image, alt: "MOSCOW", position: 0 }] : []}
            onChange={(next) => set("home_story_image", next[0]?.url ?? null)}
            folder="banners"
            max={1}
          />
        </div>
      </Card>

      <Card title="About page copy" note="One paragraph per line. Leave empty to use the built-in copy.">
        <div className="grid gap-5 lg:grid-cols-2">
          <Area label="About (English)" value={form.about_body} onChange={(v) => set("about_body", v)} rows={6} />
          <Area label="من نحن (عربي)" value={form.about_body_ar} onChange={(v) => set("about_body_ar", v)} rows={6} dir="rtl" />
        </div>
      </Card>

      {(["announcement", "home"] as const).map((placement) => (
        <Card
          key={placement}
          title={placement === "announcement" ? "Announcement bar" : "Homepage promo banners"}
          note={
            placement === "announcement"
              ? "The thin strip above the header. Keep it to one short line."
              : "Full-width promotional blocks between homepage sections."
          }
        >
          <ul className="space-y-4">
            {banners
              .filter((b) => b.placement === placement)
              .map((b) => (
                <li key={b.id} className="rounded-lg border border-silver-200 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Title (English)" value={b.title} onChange={(v) => updateBanner(b.id, { title: v })} />
                    <Text label="العنوان (عربي)" value={b.title_ar ?? ""} onChange={(v) => updateBanner(b.id, { title_ar: v })} dir="rtl" />
                    <Text label="Subtitle (English)" value={b.subtitle ?? ""} onChange={(v) => updateBanner(b.id, { subtitle: v })} />
                    <Text label="النص الفرعي (عربي)" value={b.subtitle_ar ?? ""} onChange={(v) => updateBanner(b.id, { subtitle_ar: v })} dir="rtl" />
                    <Text label="Button label" value={b.cta_label ?? ""} onChange={(v) => updateBanner(b.id, { cta_label: v })} />
                    <Text label="Button link" value={b.cta_href ?? ""} onChange={(v) => updateBanner(b.id, { cta_href: v })} mono />
                  </div>

                  {placement === "home" && (
                    <div className="mt-4">
                      <p className="label">Background image</p>
                      <ImageUploader
                        images={b.image ? [{ url: b.image, alt: b.title, position: 0 }] : []}
                        onChange={(next) => updateBanner(b.id, { image: next[0]?.url ?? null })}
                        folder="banners"
                        max={1}
                      />
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateBanner(b.id, { visible: !b.visible })}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-colors",
                        b.visible ? "bg-emerald-50 text-emerald-700" : "bg-ice-100 text-ice-500",
                      )}
                    >
                      {b.visible ? <Eye className="h-3.5 w-3.5" strokeWidth={1.6} /> : <EyeOff className="h-3.5 w-3.5" strokeWidth={1.6} />}
                      {b.visible ? "Visible" : "Hidden"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBanners((bs) => bs.filter((x) => x.id !== b.id))}
                      className="ms-auto grid h-9 w-9 place-items-center rounded-full text-ice-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete banner"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                    </button>
                  </div>
                </li>
              ))}
          </ul>

          <button
            type="button"
            onClick={() => addBanner(placement)}
            className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-ice-700 hover:text-ice-950"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Add banner
          </button>
        </Card>
      ))}

      <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-silver-200 bg-white/92 py-4 backdrop-blur">
        <button type="button" onClick={save} disabled={busy} className="btn btn-primary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Save className="h-4 w-4" strokeWidth={1.75} />}
          Save content
        </button>
        <p className="text-[12px] text-ice-500">Published to the live site immediately.</p>
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
  dir,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "rtl" | "ltr";
  mono?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        value={value}
        dir={dir}
        onChange={(e) => onChange(e.target.value)}
        className={cn("field", mono && "font-mono")}
      />
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
      <textarea
        value={value}
        rows={rows}
        dir={dir}
        onChange={(e) => onChange(e.target.value)}
        className="field resize-y"
      />
    </div>
  );
}
