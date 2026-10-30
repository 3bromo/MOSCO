"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

export default function ProfileForm({
  initial,
}: {
  initial: { full_name: string; phone: string; email: string };
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useUI((s) => s.toast);

  const [values, setValues] = useState({ full_name: initial.full_name, phone: initial.phone });
  const [errors, setErrors] = useState<{ full_name?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (values.full_name.trim().length < 2) next.full_name = t("auth.required");
    if (values.phone.replace(/\D/g, "").length < 8) next.phone = t("auth.required");
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "profile", ...values }),
      });
      if (!res.ok) throw new Error();
      toast(t("account.updated"), "success");
      router.refresh();
    } catch {
      toast(t("common.somethingWrong"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label className="label" htmlFor="p_name">
          {t("auth.name")}
        </label>
        <input
          id="p_name"
          value={values.full_name}
          onChange={(e) => {
            setValues((s) => ({ ...s, full_name: e.target.value }));
            setErrors((s) => ({ ...s, full_name: undefined }));
          }}
          aria-invalid={Boolean(errors.full_name)}
          className={cn("field", errors.full_name && "is-invalid")}
          autoComplete="name"
        />
        {errors.full_name && <span className="err">{errors.full_name}</span>}
      </div>

      <div>
        <label className="label" htmlFor="p_phone">
          {t("auth.phone")}
        </label>
        <input
          id="p_phone"
          value={values.phone}
          dir="ltr"
          inputMode="tel"
          onChange={(e) => {
            setValues((s) => ({ ...s, phone: e.target.value }));
            setErrors((s) => ({ ...s, phone: undefined }));
          }}
          aria-invalid={Boolean(errors.phone)}
          className={cn("field", errors.phone && "is-invalid")}
          autoComplete="tel"
        />
        {errors.phone && <span className="err">{errors.phone}</span>}
      </div>

      <div>
        <label className="label" htmlFor="p_email">
          {t("auth.email")}
        </label>
        <div className="relative">
          <input
            id="p_email"
            value={initial.email}
            readOnly
            dir="ltr"
            className="field cursor-not-allowed bg-ice-50 pe-11 text-ice-500"
          />
          <Lock
            className="absolute end-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ice-400"
            strokeWidth={1.6}
          />
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn btn-primary">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : t("common.save")}
      </button>
    </form>
  );
}
