"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";
type Field = "full_name" | "email" | "phone" | "password" | "confirm" | "form";

export default function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useUI((s) => s.toast);

  const [values, setValues] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((s) => ({ ...s, [k]: undefined, form: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) next.email = t("auth.invalid");
    if (values.password.length < 8) next.password = t("auth.weakPassword");

    if (mode === "register") {
      if (values.full_name.trim().length < 2) next.full_name = t("auth.required");
      if (values.phone.replace(/\D/g, "").length < 8) next.phone = t("auth.required");
      if (values.confirm !== values.password) next.confirm = t("auth.mismatch");
    }
    return next;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email: values.email, password: values.password }
          : {
              full_name: values.full_name,
              email: values.email,
              phone: values.phone,
              password: values.password,
            };

      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "exists") setErrors({ email: t("auth.exists") });
        else if (data.error === "invalid") setErrors({ form: t("auth.invalid") });
        else if (data.error === "validation") setErrors({ form: t("auth.invalid") });
        else setErrors({ form: t("common.somethingWrong") });
        return;
      }

      toast(mode === "login" ? t("auth.login") : t("auth.register"), "success");
      const target = next || (data.role === "admin" ? "/admin" : "/account");
      router.push(target);
      router.refresh();
    } catch {
      setErrors({ form: t("common.somethingWrong") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {errors.form && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-[13px] text-red-700">{errors.form}</p>
      )}

      {mode === "register" && (
        <Field
          id="full_name"
          label={t("auth.name")}
          value={values.full_name}
          onChange={set("full_name")}
          error={errors.full_name}
          autoComplete="name"
        />
      )}

      <Field
        id="email"
        label={t("auth.email")}
        type="email"
        dir="ltr"
        inputMode="email"
        value={values.email}
        onChange={set("email")}
        error={errors.email}
        autoComplete="email"
      />

      {mode === "register" && (
        <Field
          id="phone"
          label={t("auth.phone")}
          dir="ltr"
          inputMode="tel"
          placeholder="01X XXXX XXXX"
          value={values.phone}
          onChange={set("phone")}
          error={errors.phone}
          autoComplete="tel"
        />
      )}

      <div>
        <label className="label" htmlFor="password">
          {t("auth.password")}
        </label>
        <div className="relative">
          <input
            id="password"
            type={show ? "text" : "password"}
            value={values.password}
            onChange={set("password")}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            aria-invalid={Boolean(errors.password)}
            className={cn("field pe-12", errors.password && "is-invalid")}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute end-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ice-500 hover:bg-ice-100 hover:text-ice-900"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
        {errors.password && <span className="err">{errors.password}</span>}
      </div>

      {mode === "register" && (
        <Field
          id="confirm"
          label={t("auth.confirmPassword")}
          type="password"
          value={values.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
          autoComplete="new-password"
        />
      )}

      <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3.5">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : mode === "login" ? (
          t("auth.login")
        ) : (
          t("auth.register")
        )}
      </button>

      <p className="text-center text-[13px] text-ice-600">
        {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
        <Link
          href={mode === "login" ? "/account/register" : "/account/login"}
          className="font-medium text-ice-900 underline underline-offset-4"
        >
          {mode === "login" ? t("auth.register") : t("auth.login")}
        </Link>
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  ...rest
}: { id: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        className={cn("field", error && "is-invalid")}
        {...rest}
      />
      {error && <span className="err">{error}</span>}
    </div>
  );
}
