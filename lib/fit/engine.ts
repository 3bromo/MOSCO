import type { FitAiSettings, Product, SizeRow } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/config";
import { clamp, round } from "@/lib/utils";

export type BodyShape = "slim" | "athletic" | "average" | "fuller";
export type FitPreference = "slim" | "regular" | "oversized";
export type Confidence = "high" | "medium" | "low";

export interface FitAnswers {
  heightCm: number;
  weightKg: number;
  shape: BodyShape;
  preference: FitPreference;
}

export interface EstimatedBody {
  chest: number;
  waist: number;
  hip: number;
  shoulder: number;
  bmi: number;
}

export interface SizeScore {
  size: string;
  /** Garment circumference used for the match, in cm. */
  garmentCm: number | null;
  /** Signed difference: garment − target. Positive = roomier than asked for. */
  deltaCm: number | null;
  inStock: boolean;
  rangeMatch: boolean;
  score: number;
}

export interface FitResult {
  /** false when the product has no usable measurements at all. */
  precise: boolean;
  recommended: string | null;
  alternative: { size: string; direction: "up" | "down" } | null;
  confidence: Confidence;
  body: EstimatedBody;
  targetCm: number | null;
  measurementKey: "chest" | "waist" | null;
  scores: SizeScore[];
  recommendedInStock: boolean;
  /** An in-stock size to fall back to when the ideal one is sold out. */
  inStockFallback: string | null;
}

export const DEFAULT_FIT_SETTINGS: FitAiSettings = {
  enabled: true,
  show_confidence: true,
  ease_slim: 6,
  ease_regular: 12,
  ease_oversized: 20,
  tolerance: 5,
};

/* ------------------------------------------------------------------ *
 * Body estimation
 * ------------------------------------------------------------------ */

const SHAPE_ADJUST: Record<BodyShape, { chest: number; waist: number; hip: number; shoulder: number }> =
  {
    slim: { chest: -4, waist: -5.5, hip: -3, shoulder: -0.5 },
    athletic: { chest: 3, waist: -4, hip: -1, shoulder: 1.5 },
    average: { chest: 0, waist: 0, hip: 0, shoulder: 0 },
    fuller: { chest: 3, waist: 8, hip: 4.5, shoulder: 0 },
  };

export function estimateBody(a: FitAnswers): EstimatedBody {
  const h = clamp(a.heightCm, 140, 215);
  const w = clamp(a.weightKg, 40, 180);
  const bmi = w / (h / 100) ** 2;

  const chestBase = 0.52 * w + 0.47 * h - 22;
  const waistBase = chestBase - 14 + (bmi - 23) * 1.6;
  const hipBase = chestBase - 2 + (bmi - 23) * 0.8;
  const shoulderBase = 0.245 * h + 0.045 * w;

  const adj = SHAPE_ADJUST[a.shape];

  return {
    chest: round(clamp(chestBase + adj.chest, 70, 150)),
    waist: round(clamp(waistBase + adj.waist, 58, 145)),
    hip: round(clamp(hipBase + adj.hip, 72, 150)),
    shoulder: round(clamp(shoulderBase + adj.shoulder, 36, 58)),
    bmi: round(bmi, 1),
  };
}

/* ------------------------------------------------------------------ *
 * Measurement handling
 *
 * Charts are stored FLAT (half) in cm, as garments are measured on a table.
 * Circumference = flat × 2. Which field matters depends on the garment type,
 * and every product carries its own chart — there is no global fallback.
 * ------------------------------------------------------------------ */

export function measurementKeyFor(p: Pick<Product, "garment_type">): "chest" | "waist" | null {
  switch (p.garment_type) {
    case "top":
    case "set":
      return "chest";
    case "bottom":
      return "waist";
    default:
      return null;
  }
}

export function hasUsableChart(p: Pick<Product, "garment_type" | "sizes">): boolean {
  const key = measurementKeyFor(p);
  if (!key) return false;
  return p.sizes.some((s) => typeof s[key] === "number" && (s[key] as number) > 0);
}

/** Ease added to the body measurement, scaled down for bottoms. */
export function easeFor(
  pref: FitPreference,
  key: "chest" | "waist",
  settings: FitAiSettings,
): number {
  const base =
    pref === "slim"
      ? settings.ease_slim
      : pref === "oversized"
        ? settings.ease_oversized
        : settings.ease_regular;
  // A waistband has far less tolerance than a chest, so bottoms use ~45%.
  return key === "waist" ? round(base * 0.45) : base;
}

function rangeMatches(row: SizeRow, a: FitAnswers): boolean {
  const hOk =
    row.bodyHeightMin == null ||
    row.bodyHeightMax == null ||
    (a.heightCm >= row.bodyHeightMin - 2 && a.heightCm <= row.bodyHeightMax + 2);
  const wOk =
    row.bodyWeightMin == null ||
    row.bodyWeightMax == null ||
    (a.weightKg >= row.bodyWeightMin - 3 && a.weightKg <= row.bodyWeightMax + 3);
  return hOk && wOk;
}

/**
 * How far outside a size's published body range the customer sits.
 * 0 = comfortably inside. Height and weight are normalised against typical
 * grading steps (5 cm / 8 kg) so neither dominates.
 */
function rangePenalty(row: SizeRow, a: FitAnswers): number | null {
  const hasH = row.bodyHeightMin != null && row.bodyHeightMax != null;
  const hasW = row.bodyWeightMin != null && row.bodyWeightMax != null;
  if (!hasH && !hasW) return null;

  let pen = 0;
  if (hasH) {
    if (a.heightCm < row.bodyHeightMin!) pen += (row.bodyHeightMin! - a.heightCm) / 5;
    else if (a.heightCm > row.bodyHeightMax!) pen += (a.heightCm - row.bodyHeightMax!) / 5;
  }
  if (hasW) {
    if (a.weightKg < row.bodyWeightMin!) pen += (row.bodyWeightMin! - a.weightKg) / 8;
    else if (a.weightKg > row.bodyWeightMax!) pen += (a.weightKg - row.bodyWeightMax!) / 8;
  }
  return pen;
}

/**
 * The size this product's own grading says the customer is — the designer's
 * intent, which is what "regular fit" should honour. Without it, a deliberately
 * boxy jacket would recommend an S to a 76 kg customer simply because its S
 * already carries 20 cm of ease.
 */
function anchorRow(sizes: SizeRow[], a: FitAnswers): { row: SizeRow; penalty: number } | null {
  const scored = sizes
    .map((row) => ({ row, penalty: rangePenalty(row, a) }))
    .filter((s): s is { row: SizeRow; penalty: number } => s.penalty !== null)
    .sort((x, y) => x.penalty - y.penalty);
  return scored[0] ?? null;
}

/* ------------------------------------------------------------------ *
 * Recommendation
 * ------------------------------------------------------------------ */

export function recommendSize(
  product: Pick<Product, "garment_type" | "sizes" | "intrinsic_fit">,
  answers: FitAnswers,
  settings: FitAiSettings = DEFAULT_FIT_SETTINGS,
): FitResult {
  const body = estimateBody(answers);
  const key = measurementKeyFor(product);
  const sizes = product.sizes ?? [];

  // No measurable chart → honest degraded mode, driven by published body ranges.
  if (!key || !hasUsableChart(product)) {
    const byRange = sizes.filter((s) => rangeMatches(s, answers));
    const pick = byRange.find((s) => s.stock > 0) ?? byRange[0] ?? null;
    return {
      precise: false,
      recommended: pick?.size ?? null,
      alternative: null,
      confidence: "low",
      body,
      targetCm: null,
      measurementKey: null,
      scores: sizes.map((s) => ({
        size: s.size,
        garmentCm: null,
        deltaCm: null,
        inStock: s.stock > 0,
        rangeMatch: rangeMatches(s, answers),
        score: rangeMatches(s, answers) ? 1 : 0,
      })),
      recommendedInStock: (pick?.stock ?? 0) > 0,
      inStockFallback: sizes.find((s) => s.stock > 0)?.size ?? null,
    };
  }

  const bodyCm = key === "chest" ? body.chest : body.waist;

  /* ---- target circumference -------------------------------------------
   * Preferred path: anchor on the size this product's own grading assigns to
   * the customer, then shift by the difference between their chosen fit and
   * a regular fit. "Regular" therefore lands exactly on the brand's intent,
   * whatever ease that garment was drafted with.
   * Fallback (no published body ranges): absolute body + ease.
   * -------------------------------------------------------------------- */
  const anchor = anchorRow(sizes, answers);
  const anchorGarment =
    anchor && typeof anchor.row[key] === "number" && (anchor.row[key] as number) > 0
      ? (anchor.row[key] as number) * 2
      : null;

  const prefShift =
    easeFor(answers.preference, key, settings) - easeFor("regular", key, settings);

  const usedAnchor = anchorGarment != null;
  const target = usedAnchor
    ? round(anchorGarment + prefShift)
    : round(bodyCm + easeFor(answers.preference, key, settings));

  const scores: SizeScore[] = sizes.map((row) => {
    const flat = row[key];
    const garmentCm = typeof flat === "number" && flat > 0 ? round(flat * 2) : null;
    const deltaCm = garmentCm == null ? null : round(garmentCm - target);
    const rangeMatch = rangeMatches(row, answers);

    let score = 0;
    if (deltaCm != null) {
      // Being tight is worse than being roomy — asymmetric penalty.
      const penalty = deltaCm < 0 ? Math.abs(deltaCm) * 1.6 : deltaCm;
      score = 100 - penalty * 3;
      if (rangeMatch) score += 10;
      if (row.stock <= 0) score -= 4; // nudge, never a hard veto
    }
    return { size: row.size, garmentCm, deltaCm, inStock: row.stock > 0, rangeMatch, score };
  });

  const ranked = [...scores]
    .filter((s) => s.deltaCm != null)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0] ?? null;
  const runnerUp = ranked[1] ?? null;

  const bestRow = sizes.find((s) => s.size === best?.size);
  const absDelta = best?.deltaCm == null ? Infinity : Math.abs(best.deltaCm);

  /* Confidence is capped when we had to guess the designer's intent, and
     degrades as the customer falls further outside the published grading. */
  const anchorPenalty = anchor?.penalty ?? Infinity;
  let confidence: Confidence = "low";
  if (usedAnchor) {
    if (anchorPenalty === 0 && absDelta <= settings.tolerance) confidence = "high";
    else if (anchorPenalty <= 1 && absDelta <= settings.tolerance * 2) confidence = "medium";
  } else if (absDelta <= settings.tolerance) {
    // No body grading published — never claim high confidence.
    confidence = "medium";
  }

  const alternative =
    runnerUp && best
      ? {
          size: runnerUp.size,
          direction: ((runnerUp.garmentCm ?? 0) > (best.garmentCm ?? 0) ? "up" : "down") as
            | "up"
            | "down",
        }
      : null;

  return {
    precise: true,
    recommended: best?.size ?? null,
    alternative,
    confidence,
    body,
    targetCm: target,
    measurementKey: key,
    scores,
    recommendedInStock: (bestRow?.stock ?? 0) > 0,
    inStockFallback:
      ranked.find((s) => s.inStock && s.size !== best?.size)?.size ??
      sizes.find((s) => s.stock > 0)?.size ??
      null,
  };
}

/* ------------------------------------------------------------------ *
 * Human-readable explanation
 * ------------------------------------------------------------------ */

const PREF_LABEL: Record<FitPreference, Record<Locale, string>> = {
  slim: { en: "a slim fit", en: "قَصّة ضيقة" },
  regular: { en: "a regular fit", en: "قَصّة عادية" },
  oversized: { en: "an oversized fit", en: "قَصّة واسعة" },
};

const PART_LABEL: Record<"chest" | "waist", Record<Locale, string>> = {
  chest: { en: "chest", en: "الصدر" },
  waist: { en: "waist", en: "الخصر" },
};

export function explainFit(
  result: FitResult,
  answers: FitAnswers,
  locale: Locale = "en",
): string {
  const en = "en";

  if (!result.recommended) {
    return en
      ? "لا توجد مقاسات كافية لهذا المنتج لإعطاء توصية. برجاء مراجعة جدول المقاسات أو التواصل معنا."
      : "There aren't enough measurements on this product to make a recommendation. Please check the size chart or contact us.";
  }

  if (!result.precise) {
    return en
      ? `بناءً على طولك ووزنك فقط، مقاس ${result.recommended} هو الأقرب. هذا المنتج لم تُنشر له قياسات تفصيلية بعد، لذا هذه إرشادات تقريبية.`
      : `Based on your height and weight alone, size ${result.recommended} is the closest match. This product has no detailed measurements published yet, so treat this as a rough guide.`;
  }

  const key = result.measurementKey!;
  const best = result.scores.find((s) => s.size === result.recommended)!;
  const bodyVal = key === "chest" ? result.body.chest : result.body.waist;
  const part = PART_LABEL[key][locale];
  const pref = PREF_LABEL[answers.preference][locale];
  const delta = best.deltaCm ?? 0;

  const exact = Math.abs(delta) < 1.5;

  if (en) {
    const easeTxt = exact
      ? "وهو تطابق تام مع المستهدف"
      : delta > 0
        ? `بزيادة ${Math.abs(round(delta))} سم عن المستهدف`
        : `بنقص ${Math.abs(round(delta))} سم عن المستهدف`;
    return `قدّرنا محيط ${part} لديك بحوالي ${bodyVal} سم. مع ${pref}، المستهدف ${result.targetCm} سم، ومقاس ${result.recommended} في هذا المنتج تحديداً يعطي ${best.garmentCm} سم — ${easeTxt}.`;
  }

  const easeTxt = exact
    ? "an exact match for your target"
    : delta > 0
      ? `${Math.abs(round(delta))} cm roomier than your target`
      : `${Math.abs(round(delta))} cm closer than your target`;
  return `We estimate your ${part} at about ${bodyVal} cm. For ${pref} that puts your target at ${result.targetCm} cm, and size ${result.recommended} on this specific product measures ${best.garmentCm} cm — ${easeTxt}.`;
}

export function explainAlternative(
  result: FitResult,
  locale: Locale = "en",
): string | null {
  if (!result.alternative) return null;
  const en = "en";
  const { size, direction } = result.alternative;
  if (direction === "up") {
    return en
      ? `مقاس ${size} إذا كنت تفضل مساحة أكبر.`
      : `Size ${size} if you want more room.`;
  }
  return en ? `مقاس ${size} إذا كنت تفضل قَصّة أقرب للجسم.` : `Size ${size} for a closer cut.`;
}
