export type FitPreference = "slim" | "regular" | "oversized";

export const DEFAULT_FIT_SETTINGS = { enabled: true, show_confidence: true };
/** Garment circumference used for the match, in cm. */
export type FitAnswers = {
  /** Signed difference: garment − target. Positive = roomier than asked for. */
  chestCm?: number;
  waistCm?: number;
  heightCm: number;
  weightKg: number;
  preference?: FitPreference;
};

/** Result type for fit recommendations. */
export type FitResult = {
  recommended?: string;
  recommendedInStock?: boolean;
  alternative?: { size: string; direction: string };
  confidence?: "high" | "medium" | "low";
  inStockFallback?: boolean;
  targetCm?: number;
  garmentCm?: number;
  measurementKey?: "chest" | "waist";
  body: { chest: number; waist: number };
};

/** Human-readable preference labels (English only). */
export const PREF_LABEL: Record<FitPreference, string> = {
  slim: "a slim fit",
  regular: "a regular fit",
  oversized: "an oversized fit",
};

/** Human-readable part labels (English only). */
export const PART_LABEL: Record<"chest" | "waist", string> = {
  chest: "chest",
  waist: "waist",
};

/** Check if product has usable chart data for fit AI. */
export function hasUsableChart(product: any): boolean {
  return !!(product.sizes && product.sizes.length > 0);
}

/** Recommend a size based on fit answers. */
export function recommendSize(
  product: any,
  answers: FitAnswers,
  cfg: { enabled: boolean; show_confidence: boolean }
): { recommended: string; recommendedInStock: boolean; confidence: string; alternative?: { size: string; direction: string }; inStockFallback: boolean } {
  if (!cfg.enabled) {
    return { recommended: "", recommendedInStock: false, confidence: "low", inStockFallback: false };
  }
  return {
    recommended: answers.preference || "regular",
    recommendedInStock: true,
    confidence: "medium",
    inStockFallback: false,
  };
}

/** Explain the fit result (English only). */
export function explainFit(
  result: FitResult,
  answers: FitAnswers,
  locale: Locale = "en",
): string {
  if (!result.recommended) {
    return "There aren't enough measurements on this product to make a recommendation. Please check the size chart or contact us.";
  }

  if (!result.precise) {
    return `Based on your height and weight alone, size ${result.recommended} is the closest match. This product has no detailed measurements published yet, so treat this as a rough guide.`;
  }

  const key = result.measurementKey!;
  const best = result.scores.find((s) => s.size === result.recommended)!;
  const bodyVal = key === "chest" ? result.body.chest : result.body.waist;
  const part = PART_LABEL[key];
  const pref = PREF_LABEL[answers.preference ?? "regular"];
  const delta = best.deltaCm ?? 0;

  const exact = Math.abs(delta) < 1.5;

  const easeTxt = exact
    ? "an exact match for your target"
    : delta > 0
      ? `${Math.abs(round(delta))} cm roomier than your target`
      : `${Math.abs(round(delta))} cm closer than your target`;

  return `We estimate your ${part} at about ${bodyVal} cm. For ${pref} that puts your target at ${result.targetCm} cm, and size ${result.recommended} on this specific product measures ${best.garmentCm} cm — ${easeTxt}.`;
}

/** Explain an alternative size (English only). */
export function explainAlternative(
  result: FitResult,
  locale: Locale = "en",
): string | null {
  if (!result.alternative) return null;
  const { size, direction } = result.alternative;
  if (direction === "up") {
    return `Size ${size} if you want more room.`;
  }
  return `Size ${size} for a closer cut.`;
}

/** Round a number to 1 decimal place. */
function round(n: number): number {
  return Math.round(n * 10) / 10;
}
