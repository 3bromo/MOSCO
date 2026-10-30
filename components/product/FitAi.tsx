"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RefreshCw, Ruler, Sparkles } from "lucide-react";
import type { FitAiSettings, Product } from "@/lib/db/types";
import {
  DEFAULT_FIT_SETTINGS,
  explainAlternative,
  explainFit,
  hasUsableChart,
  recommendSize,
  type BodyShape,
  type FitAnswers,
  type FitPreference,
} from "@/lib/fit/engine";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { cn, inToCm } from "@/lib/utils";

type Step = 0 | 1 | 2 | 3;

const SHAPES: BodyShape[] = ["slim", "athletic", "average", "fuller"];
const PREFS: FitPreference[] = ["slim", "regular", "oversized"];

export default function FitAi({
  product,
  settings,
  selectedSize,
  onSelectSize,
  onOpenChart,
}: {
  product: Product;
  settings?: FitAiSettings;
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
  onOpenChart: () => void;
}) {
  const { t, locale } = useI18n();
  const cfg = settings ?? DEFAULT_FIT_SETTINGS;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [shape, setShape] = useState<BodyShape | null>(null);
  const [pref, setPref] = useState<FitPreference | null>(null);
  const [errors, setErrors] = useState<{ height?: string; weight?: string }>({});

  const precise = hasUsableChart(product);

  const answers: FitAnswers | null = useMemo(() => {
    const h = Number(height);
    const w = Number(weight);
    if (!h || !w || !shape || !pref) return null;
    return {
      heightCm: units === "metric" ? h : inToCm(h),
      weightKg: units === "metric" ? w : w * 0.453592,
      shape,
      preference: pref,
    };
  }, [height, weight, shape, pref, units]);

  const result = useMemo(
    () => (answers && step === 3 ? recommendSize(product, answers, cfg) : null),
    [answers, product, cfg, step],
  );

  if (!cfg.enabled) return null;

  function validateStep1(): boolean {
    const h = Number(height);
    const w = Number(weight);
    const hCm = units === "metric" ? h : inToCm(h);
    const wKg = units === "metric" ? w : w * 0.453592;
    const next: typeof errors = {};
    if (!h || hCm < 140 || hCm > 215) next.height = t("fit.invalidHeight");
    if (!w || wKg < 40 || wKg > 180) next.weight = t("fit.invalidWeight");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function reset() {
    setStep(0);
    setHeight("");
    setWeight("");
    setShape(null);
    setPref(null);
    setErrors({});
  }

  return (
    <section className="overflow-hidden rounded-lg border border-ice-300 bg-gradient-to-b from-ice-50 to-white">
      {/* header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3.5 px-4 py-4 text-start transition-colors hover:bg-ice-50 sm:px-5"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ice-900 text-white">
          <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </span>
        <span className="flex-1">
          <span className="block font-display text-[15px] uppercase tracking-tight text-ice-900">
            {t("fit.title")}
          </span>
          <span className="mt-0.5 block text-[12px] text-ice-600">{t("fit.sub")}</span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full border border-ice-400 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-ice-800 transition-transform duration-300",
            open && "rotate-0 opacity-70",
          )}
        >
          {open ? t("common.close") : t("fit.start")}
        </span>
      </button>

      {open && (
        <div className="border-t border-ice-200 px-4 pb-5 pt-5 sm:px-5">
          {!precise && (
            <p className="mb-4 rounded-md bg-amber-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-amber-900">
              {t("fit.noData")}
            </p>
          )}

          {/* progress */}
          {step < 3 && (
            <div className="mb-5 flex items-center gap-3">
              <div className="flex flex-1 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-400",
                      i <= step ? "bg-ice-900" : "bg-ice-200",
                    )}
                  />
                ))}
              </div>
              <span className="text-[11px] tabular-nums text-ice-500">
                {t("fit.step", { n: step + 1 })}
              </span>
            </div>
          )}

          {/* ---------------- step 1 ---------------- */}
          {step === 0 && (
            <div className="animate-fade-in">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-medium text-ice-900">{t("fit.q1")}</h3>
                <div className="flex shrink-0 rounded-full bg-ice-100 p-0.5">
                  {(["metric", "imperial"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnits(u)}
                      aria-pressed={units === u}
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-medium transition-all",
                        units === u ? "bg-ice-900 text-white" : "text-ice-700",
                      )}
                    >
                      {u === "metric" ? "cm / kg" : "in / lb"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="fit-h">
                    {t("fit.height")} ({units === "metric" ? "cm" : "in"})
                  </label>
                  <input
                    id="fit-h"
                    type="number"
                    inputMode="decimal"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="field"
                    aria-invalid={Boolean(errors.height)}
                    placeholder={units === "metric" ? "176" : "69"}
                    style={{ fontSize: 16 }}
                  />
                  {errors.height && <span className="err">{errors.height}</span>}
                </div>
                <div>
                  <label className="label" htmlFor="fit-w">
                    {t("fit.weight")} ({units === "metric" ? "kg" : "lb"})
                  </label>
                  <input
                    id="fit-w"
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="field"
                    aria-invalid={Boolean(errors.weight)}
                    placeholder={units === "metric" ? "76" : "168"}
                    style={{ fontSize: 16 }}
                  />
                  {errors.weight && <span className="err">{errors.weight}</span>}
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => validateStep1() && setStep(1)}
                  className="btn btn-primary"
                >
                  {t("fit.next")}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- step 2 ---------------- */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h3 className="mb-4 text-[15px] font-medium text-ice-900">{t("fit.q2")}</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {SHAPES.map((s) => (
                  <Choice
                    key={s}
                    active={shape === s}
                    title={t(`fit.shape.${s}`)}
                    desc={t(`fit.shape.${s}Desc`)}
                    onClick={() => setShape(s)}
                  />
                ))}
              </div>
              <Nav
                onBack={() => setStep(0)}
                onNext={() => shape && setStep(2)}
                nextDisabled={!shape}
                t={t}
              />
            </div>
          )}

          {/* ---------------- step 3 ---------------- */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h3 className="mb-4 text-[15px] font-medium text-ice-900">{t("fit.q3")}</h3>
              <div className="grid gap-2.5">
                {PREFS.map((p) => (
                  <Choice
                    key={p}
                    active={pref === p}
                    title={t(`fit.pref.${p}`)}
                    desc={t(`fit.pref.${p}Desc`)}
                    onClick={() => setPref(p)}
                    row
                  />
                ))}
              </div>
              <Nav
                onBack={() => setStep(1)}
                onNext={() => pref && setStep(3)}
                nextDisabled={!pref}
                nextLabel={t("fit.result")}
                t={t}
              />
            </div>
          )}

          {/* ---------------- result ---------------- */}
          {step === 3 && result && answers && (
            <div className="animate-fade-in">
              <div className="rounded-lg border border-ice-300 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">{t("fit.result")}</p>
                    <p className="mt-2 font-display text-4xl tracking-tight text-ice-900">
                      {result.recommended ?? "—"}
                    </p>
                  </div>

                  {cfg.show_confidence && result.recommended && (
                    <div className="text-end">
                      <p className="eyebrow">{t("fit.confidence")}</p>
                      <div className="mt-2 flex items-center justify-end gap-1.5">
                        {[0, 1, 2].map((i) => {
                          const level =
                            result.confidence === "high" ? 3 : result.confidence === "medium" ? 2 : 1;
                          return (
                            <span
                              key={i}
                              className={cn(
                                "h-1.5 w-6 rounded-full",
                                i < level ? "bg-ice-800" : "bg-ice-200",
                              )}
                            />
                          );
                        })}
                      </div>
                      <p className="mt-1.5 text-[11px] text-ice-600">
                        {t(`fit.confidence.${result.confidence}`)}
                      </p>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-[13.5px] leading-relaxed text-ice-700">
                  {explainFit(result, answers, locale)}
                </p>

                {result.alternative && (
                  <p className="mt-2.5 text-[13px] text-ice-600">
                    <span className="font-medium text-ice-800">{t("fit.alsoConsider")}: </span>
                    {explainAlternative(result, locale)}
                  </p>
                )}

                {result.recommended && !result.recommendedInStock && (
                  <p className="mt-3 rounded-md bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-900">
                    {t("product.outOfStock")} — {result.recommended}.
                    {result.inStockFallback ? ` ${t("fit.alsoConsider")}: ${result.inStockFallback}.` : ""}
                  </p>
                )}

                {/* Selection is always explicit — nothing is ever added to the bag. */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {result.recommended && (
                    <button
                      type="button"
                      onClick={() => onSelectSize(result.recommended!)}
                      disabled={!result.recommendedInStock}
                      className={cn(
                        "btn",
                        selectedSize === result.recommended ? "btn-ice" : "btn-primary",
                      )}
                    >
                      {selectedSize === result.recommended ? (
                        <>
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          {t("fit.selected", { size: result.recommended })}
                        </>
                      ) : (
                        t("fit.selectThis", { size: result.recommended })
                      )}
                    </button>
                  )}
                  <button type="button" onClick={onOpenChart} className="btn btn-ghost">
                    <Ruler className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {t("chart.title")}
                  </button>
                  <button type="button" onClick={reset} className="btn btn-ghost">
                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {t("fit.restart")}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-[11.5px] leading-relaxed text-ice-500">
                {localized(cfg, "disclaimer", locale) || t("fit.disclaimer")}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Choice({
  active,
  title,
  desc,
  onClick,
  row = false,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
  row?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg border p-3.5 text-start transition-all duration-300",
        row && "flex items-center gap-3",
        active
          ? "border-ice-900 bg-ice-50 ring-1 ring-ice-900"
          : "border-silver-300 bg-white hover:border-ice-400",
      )}
    >
      <span className="block text-[14px] font-medium text-ice-900">{title}</span>
      <span className={cn("block text-[12px] text-ice-600", row ? "ms-auto text-end" : "mt-0.5")}>
        {desc}
      </span>
    </button>
  );
}

function Nav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  t,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
  nextLabel?: string;
  t: (k: string) => string;
}) {
  return (
    <div className="mt-5 flex items-center justify-between">
      <button type="button" onClick={onBack} className="btn btn-ghost">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2} />
        {t("fit.prev")}
      </button>
      <button type="button" onClick={onNext} disabled={nextDisabled} className="btn btn-primary">
        {nextLabel ?? t("fit.next")}
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2} />
      </button>
    </div>
  );
}
