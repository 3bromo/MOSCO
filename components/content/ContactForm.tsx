"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

type Field = "name" | "email" | "subject" | "message";

export default function ContactForm() {
  const { t } = useI18n();
  const toast = useUI((s) => s.toast);

  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((s) => ({ ...s, [k]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    if (values.name.trim().length < 2) next.name = t("checkout.errName");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) next.email = t("checkout.errEmail");
    if (values.subject.trim().length < 2) next.subject = t("checkout.errEmpty");
    if (values.message.trim().length < 10) next.message = t("checkout.errEmpty");
    setErrors(next);
    if (Object.keys(next).length) {
      toast(t("checkout.fixErrors"), "error");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setValues({ name: "", email: "", subject: "", message: "" });
      toast(t("contact.sent"), "success");
    } catch {
      toast(t("common.somethingWrong"), "error");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
          <Check className="h-6 w-6 text-emerald-600" strokeWidth={1.75} />
        </span>
        <p className="mt-5 text-[15px] font-medium">{t("contact.sent")}</p>
        <button type="button" onClick={() => setSent(false)} className="btn btn-ghost mt-6">
          {t("contact.send")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c_name">
            {t("contact.name")}
          </label>
          <input
            id="c_name"
            value={values.name}
            onChange={set("name")}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className={cn("field", errors.name && "is-invalid")}
          />
          {errors.name && <span className="err">{errors.name}</span>}
        </div>
        <div>
          <label className="label" htmlFor="c_email">
            {t("contact.email")}
          </label>
          <input
            id="c_email"
            type="email"
            dir="ltr"
            inputMode="email"
            value={values.email}
            onChange={set("email")}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className={cn("field", errors.email && "is-invalid")}
          />
          {errors.email && <span className="err">{errors.email}</span>}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="c_subject">
          {t("contact.subject")}
        </label>
        <input
          id="c_subject"
          value={values.subject}
          onChange={set("subject")}
          aria-invalid={Boolean(errors.subject)}
          className={cn("field", errors.subject && "is-invalid")}
        />
        {errors.subject && <span className="err">{errors.subject}</span>}
      </div>

      <div>
        <label className="label" htmlFor="c_message">
          {t("contact.message")}
        </label>
        <textarea
          id="c_message"
          rows={5}
          value={values.message}
          onChange={set("message")}
          aria-invalid={Boolean(errors.message)}
          className={cn("field resize-y", errors.message && "is-invalid")}
        />
        {errors.message && <span className="err">{errors.message}</span>}
      </div>

      <button type="submit" disabled={busy} className="btn btn-primary">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <Send className="h-4 w-4 rtl:-scale-x-100" strokeWidth={1.75} />
        )}
        {t("contact.send")}
      </button>
    </form>
  );
}
