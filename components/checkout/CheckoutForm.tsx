"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Check,
  Copy,
  ImageUp,
  Loader2,
  Lock,
  Smartphone,
  Trash2,
} from "lucide-react";
import type { PaymentMethod, Settings } from "@/lib/db/types";
import { formatMoney } from "@/lib/money";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { useCart } from "@/lib/store/cart";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

type Field = "full_name" | "phone" | "email" | "city" | "address" | "payment_proof_url";

interface Props {
  settings: Pick<
    Settings,
    | "shipping_flat"
    | "free_shipping_threshold"
    | "shipping_rates"
    | "instapay_handle"
    | "instapay_name"
    | "instapay_instructions"
    | "instapay_instructions_ar"
  >;
  customer: { full_name: string; phone: string; email: string; city: string; address: string } | null;
}

export default function CheckoutForm({ settings, customer }: Props) {
  const { t, locale, dir } = useI18n();
  const router = useRouter();
  const toast = useUI((s) => s.toast);

  const lines = useCart((s) => s.lines);
  const hydrated = useCart((s) => s.hydrated);
  const clear = useCart((s) => s.clear);

  const [values, setValues] = useState({
    full_name: customer?.full_name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    city: customer?.city ?? "",
    address: customer?.address ?? "",
    notes: "",
  });
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [proof, setProof] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [promo, setPromo] = useState<{ code: string; amount: number; freeShipping: boolean } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  /* Empty cart → back to the cart page (only once hydration settles). */
  useEffect(() => {
    if (hydrated && lines.length === 0) router.replace("/cart");
  }, [hydrated, lines.length, router]);

  /* Re-apply a promo code carried over from the cart page. */
  const subtotal = useMemo(() => lines.reduce((n, l) => n + l.qty * l.unit_price, 0), [lines]);

  useEffect(() => {
    let code = "";
    try {
      code = sessionStorage.getItem("mosco.promo") ?? "";
    } catch {
      code = "";
    }
    if (!code || subtotal <= 0) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/discount", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!cancelled && data.valid) {
        setPromo({ code: data.code, amount: data.amount, freeShipping: data.freeShipping });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subtotal]);

  /* ---------------- totals ---------------- */
  const shipping = useMemo(() => {
    if (subtotal <= 0) return 0;
    if (promo?.freeShipping) return 0;
    if (settings.free_shipping_threshold > 0 && subtotal >= settings.free_shipping_threshold) return 0;
    const rate = settings.shipping_rates.find(
      (r) => r.city.toLowerCase() === values.city.toLowerCase(),
    );
    return rate ? rate.cost : settings.shipping_flat;
  }, [subtotal, promo, settings, values.city]);

  const discount = promo?.amount ?? 0;
  const total = Math.max(0, subtotal - discount + shipping);

  /* ---------------- validation ---------------- */
  const validate = useCallback(
    (v: typeof values, m: PaymentMethod, p: typeof proof) => {
      const next: Partial<Record<Field, string>> = {};
      if (v.full_name.trim().length < 2) next.full_name = t("checkout.errName");
      const digits = v.phone.replace(/\D/g, "");
      if (digits.length < 8) next.phone = t("checkout.errPhone");
      if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) {
        next.email = t("checkout.errEmail");
      }
      if (!v.city.trim()) next.city = t("checkout.errCity");
      if (v.address.trim().length < 8) next.address = t("checkout.errAddress");
      if (m === "instapay" && !p) next.payment_proof_url = t("checkout.proofRequired");
      return next;
    },
    [t],
  );

  const setField = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setValues((s) => ({ ...s, [key]: value }));
    if (errors[key as Field]) setErrors((s) => ({ ...s, [key]: undefined }));
  };

  /* ---------------- payment proof upload ---------------- */
  const onPickProof = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
      toast("en" ? "الصيغة غير مدعومة" : "Unsupported image format", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast("en" ? "الحجم أكبر من 8 ميجابايت" : "Image is larger than 8 MB", "error");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("folder", "proofs");
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "upload_failed");
      setProof({ url: data.files[0].url, name: file.name });
      setErrors((s) => ({ ...s, payment_proof_url: undefined }));
    } catch {
      toast(t("common.somethingWrong"), "error");
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- submit ---------------- */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values, method, proof);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      toast(t("checkout.fixErrors"), "error");
      const first = formRef.current?.querySelector<HTMLElement>("[data-invalid='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      first?.focus({ preventScroll: true });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          payment_method: method,
          payment_proof_url: proof?.url ?? "",
          discount_code: promo?.code ?? "",
          items: lines.map((l) => ({
            product_id: l.product_id,
            size: l.size,
            color: l.color ?? null,
            qty: l.qty,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "validation" && data.fields) {
          const mapped: Partial<Record<Field, string>> = {};
          for (const key of Object.keys(data.fields)) {
            mapped[key as Field] = t("checkout.errEmpty");
          }
          setErrors(mapped);
          toast(t("checkout.fixErrors"), "error");
        } else if (data.error === "insufficient_stock") {
          toast(t("cart.stockWarn", { n: data.available ?? 0 }), "error");
          router.push("/cart");
        } else {
          toast(t("common.somethingWrong"), "error");
        }
        return;
      }

      clear();
      try {
        sessionStorage.removeItem("mosco.promo");
        sessionStorage.setItem("mosco.lastOrder", data.order_number);
      } catch {
        /* ignore */
      }
      router.push(`/order/${data.order_number}`);
    } catch {
      toast(t("common.somethingWrong"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const copyHandle = async () => {
    try {
      await navigator.clipboard.writeText(settings.instapay_handle);
      setCopied(true);
      toast(t("common.copied"), "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  if (!hydrated || lines.length === 0) {
    return (
      <div className="mw-container grid gap-10 py-16 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-28 rounded-lg" />
          ))}
        </div>
        <div className="skeleton h-80 rounded-lg" />
      </div>
    );
  }

  const instapayInstructions =
    ("en" ? settings.instapay_instructions_ar : settings.instapay_instructions) ||
    settings.instapay_instructions;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="mw-container py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
        <div className="min-w-0 space-y-10">
          {/* ---------------- contact ---------------- */}
          <Section step={1} title={t("checkout.contact")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                id="full_name"
                label={t("checkout.fullName")}
                value={values.full_name}
                onChange={setField("full_name")}
                error={errors.full_name}
                autoComplete="name"
                required
              />
              <TextField
                id="phone"
                label={t("checkout.phone")}
                value={values.phone}
                onChange={setField("phone")}
                error={errors.phone}
                autoComplete="tel"
                inputMode="tel"
                dir="ltr"
                placeholder="01X XXXX XXXX"
                required
              />
              <div className="sm:col-span-2">
                <TextField
                  id="email"
                  label={`${t("checkout.email")} — ${t("common.optional")}`}
                  value={values.email}
                  onChange={setField("email")}
                  error={errors.email}
                  autoComplete="email"
                  inputMode="email"
                  dir="ltr"
                  placeholder="you@email.com"
                />
              </div>
            </div>
          </Section>

          {/* ---------------- delivery ---------------- */}
          <Section step={2} title={t("checkout.delivery")}>
            <div className="grid gap-5">
              <div>
                <label className="label" htmlFor="city">
                  {t("checkout.city")} <span className="text-red-600">*</span>
                </label>
                <select
                  id="city"
                  value={values.city}
                  onChange={setField("city")}
                  data-invalid={Boolean(errors.city)}
                  aria-invalid={Boolean(errors.city)}
                  className={cn("field cursor-pointer", errors.city && "is-invalid")}
                >
                  <option value="">{t("checkout.selectCity")}</option>
                  {settings.shipping_rates.map((r) => (
                    <option key={r.city} value={r.city}>
                      {"en" && r.city_ar ? r.city_ar : r.city} —{" "}
                      {formatMoney(r.cost, locale)}
                    </option>
                  ))}
                </select>
                {errors.city && <span className="err">{errors.city}</span>}
              </div>

              <div>
                <label className="label" htmlFor="address">
                  {t("checkout.address")} <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="address"
                  value={values.address}
                  onChange={setField("address")}
                  rows={3}
                  placeholder={t("checkout.addressPh")}
                  autoComplete="street-address"
                  data-invalid={Boolean(errors.address)}
                  aria-invalid={Boolean(errors.address)}
                  className={cn("field resize-y", errors.address && "is-invalid")}
                />
                {errors.address && <span className="err">{errors.address}</span>}
              </div>

              <div>
                <label className="label" htmlFor="notes">
                  {t("checkout.notes")} — {t("common.optional")}
                </label>
                <textarea
                  id="notes"
                  value={values.notes}
                  onChange={setField("notes")}
                  rows={2}
                  placeholder={t("checkout.notesPh")}
                  className="field resize-y"
                />
              </div>
            </div>
          </Section>

          {/* ---------------- payment ---------------- */}
          <Section step={3} title={t("checkout.payment")}>
            <div
              role="radiogroup"
              aria-label={t("checkout.payment")}
              className="grid gap-3 sm:grid-cols-2"
            >
              <PayOption
                active={method === "cod"}
                onSelect={() => setMethod("cod")}
                icon={<Banknote className="h-5 w-5" strokeWidth={1.5} />}
                title={t("checkout.cod")}
                desc={t("checkout.codDesc")}
              />
              <PayOption
                active={method === "instapay"}
                onSelect={() => setMethod("instapay")}
                icon={<Smartphone className="h-5 w-5" strokeWidth={1.5} />}
                title={t("checkout.instapay")}
                desc={t("checkout.instapayDesc")}
              />
            </div>

            {/* InstaPay panel — appears/disappears instantly, no reload */}
            <div
              aria-hidden={method !== "instapay"}
              className={cn(
                "grid transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
                method === "instapay"
                  ? "mt-5 grid-rows-[1fr] opacity-100"
                  : "mt-0 grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="rounded-lg border border-ice-300 bg-ice-50 p-5">
                  <h3 className="flex items-center gap-2 text-[14px] font-medium">
                    <Smartphone className="h-4 w-4 text-ice-700" strokeWidth={1.6} />
                    {t("checkout.instapayHow")}
                  </h3>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md bg-white p-3.5">
                      <dt className="text-[11px] uppercase tracking-[0.12em] text-ice-500">
                        {t("checkout.instapayHandle")}
                      </dt>
                      <dd className="mt-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-[14px] font-medium" dir="ltr">
                          {settings.instapay_handle}
                        </span>
                        <button
                          type="button"
                          onClick={copyHandle}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ice-600 transition-colors hover:bg-ice-100 hover:text-ice-900"
                          aria-label={t("common.copy")}
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
                          ) : (
                            <Copy className="h-3.5 w-3.5" strokeWidth={1.6} />
                          )}
                        </button>
                      </dd>
                    </div>
                    <div className="rounded-md bg-white p-3.5">
                      <dt className="text-[11px] uppercase tracking-[0.12em] text-ice-500">
                        {t("checkout.instapayName")}
                      </dt>
                      <dd className="mt-1 text-[14px] font-medium">{settings.instapay_name}</dd>
                    </div>
                    <div className="rounded-md bg-white p-3.5 sm:col-span-2">
                      <dt className="text-[11px] uppercase tracking-[0.12em] text-ice-500">
                        {t("checkout.instapayAmount")}
                      </dt>
                      <dd className="mt-1 font-display text-xl tabular-nums">
                        {formatMoney(total, locale)}
                      </dd>
                    </div>
                  </dl>

                  {instapayInstructions && (
                    <p className="mt-4 whitespace-pre-line text-[13px] leading-relaxed text-ice-700">
                      {instapayInstructions}
                    </p>
                  )}

                  {/* proof upload */}
                  <div className="mt-5">
                    <p className="label">
                      {t("checkout.proofLabel")} <span className="text-red-600">*</span>
                    </p>

                    {proof ? (
                      <div className="flex items-center gap-3 rounded-md border border-silver-200 bg-white p-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-ice-100">
                          <Image
                            src={proof.url}
                            alt={t("checkout.proofLabel")}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{proof.name}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-emerald-700">
                            <Check className="h-3 w-3" strokeWidth={2} />
                            {"en" ? "تم الرفع" : "Uploaded"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProof(null);
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ice-500 hover:bg-ice-100 hover:text-ice-900"
                          aria-label={t("common.remove")}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        data-invalid={Boolean(errors.payment_proof_url)}
                        className={cn(
                          "flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-white px-4 py-7 text-center transition-colors",
                          errors.payment_proof_url
                            ? "border-red-400 bg-red-50/40"
                            : "border-silver-300 hover:border-ice-500 hover:bg-ice-50/60",
                        )}
                      >
                        {uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-ice-600" strokeWidth={1.5} />
                        ) : (
                          <ImageUp className="h-5 w-5 text-ice-600" strokeWidth={1.4} />
                        )}
                        <span className="text-[13.5px] font-medium">
                          {t("checkout.proofChoose")}
                        </span>
                        <span className="text-[12px] text-ice-500">{t("checkout.proofHint")}</span>
                      </button>
                    )}

                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="sr-only"
                      onChange={(e) => onPickProof(e.target.files?.[0])}
                    />
                    {errors.payment_proof_url && (
                      <span className="err">{errors.payment_proof_url}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* ---------------- summary ---------------- */}
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <div className="rounded-lg border border-silver-200 bg-white p-6">
            <h2 className="font-display text-lg uppercase tracking-tight">
              {t("checkout.summary")}
            </h2>

            <ul className="mt-5 max-h-[320px] space-y-4 overflow-y-auto pe-1">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3">
                  <div className="relative aspect-3/4 w-14 shrink-0 overflow-hidden rounded bg-ice-100">
                    <Image
                      src={l.image}
                      alt={localized(l, "name", locale)}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                    <span className="absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ice-900 px-1 text-[10.5px] font-medium tabular-nums text-white">
                      {l.qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] leading-snug">
                      {localized(l, "name", locale)}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ice-500">
                      {t("product.size")} {l.size}
                    </p>
                  </div>
                  <span className="text-[13px] tabular-nums">
                    {formatMoney(l.unit_price * l.qty, locale)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2.5 border-t border-silver-200 pt-5 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-ice-600">{t("cart.subtotal")}</dt>
                <dd className="tabular-nums">{formatMoney(subtotal, locale)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>
                    {t("cart.discount")} · {promo?.code}
                  </dt>
                  <dd className="tabular-nums">− {formatMoney(discount, locale)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ice-600">{t("cart.shipping")}</dt>
                <dd className="tabular-nums">
                  {shipping === 0 ? t("cart.freeShipping") : formatMoney(shipping, locale)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-silver-200 pt-4">
                <dt className="text-[15px] font-medium">{t("cart.total")}</dt>
                <dd className="font-display text-2xl tabular-nums">{formatMoney(total, locale)}</dd>
              </div>
            </dl>

            {Object.keys(errors).length > 0 && (
              <p className="mt-5 flex items-start gap-2 rounded-md bg-red-50 p-3 text-[12.5px] text-red-700">
                <AlertCircle className="mt-px h-4 w-4 shrink-0" strokeWidth={1.6} />
                {t("checkout.fixErrors")}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary mt-6 w-full !py-4">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  {t("checkout.placing")}
                </>
              ) : (
                <>
                  {t("checkout.placeOrder")}
                  <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rotate-180")} strokeWidth={1.75} />
                </>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-ice-500">
              <Lock className="h-3 w-3" strokeWidth={1.6} />
              {"en"
                ? "بياناتك تُستخدم لتنفيذ الطلب فقط."
                : "Your details are used only to fulfil this order."}
            </p>

            <Link
              href="/cart"
              className="mt-3 block text-center text-[12.5px] text-ice-600 underline underline-offset-4 hover:text-ice-900"
            >
              {t("common.back")}
            </Link>
          </div>
        </aside>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------- */

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-3 font-display text-xl uppercase tracking-tight">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ice-900 text-[12px] font-medium tabular-nums text-white">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={onChange}
        data-invalid={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        className={cn("field", error && "is-invalid")}
        {...rest}
      />
      {error && (
        <span className="err" id={`${id}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}

function PayOption({
  active,
  onSelect,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-start transition-all duration-300",
        active
          ? "border-ice-800 bg-ice-50 shadow-[0_0_0_1px_var(--color-ice-800)]"
          : "border-silver-300 bg-white hover:border-ice-500",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors",
          active ? "bg-ice-900 text-white" : "bg-ice-100 text-ice-700",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[14.5px] font-medium">{title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-ice-600">{desc}</span>
      </span>
      <span
        className={cn(
          "ms-auto mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
          active ? "border-ice-900 bg-ice-900" : "border-silver-300",
        )}
      >
        {active && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
      </span>
    </button>
  );
}
