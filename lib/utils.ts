import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL-safe slug. Keeps Arabic letters so AR names still produce usable slugs. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uid(prefix = ""): string {
  const s = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${s}` : s;
}

/** MW-25-XXXXXX order numbers — short, readable over the phone. */
export function orderNumber(): string {
  const y = new Date().getFullYear().toString().slice(-2);
  const n = Math.floor(100000 + Math.random() * 900000);
  return `MW-${y}-${n}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function cmToIn(cm: number) {
  return cm / 2.54;
}

export function inToCm(inch: number) {
  return inch * 2.54;
}

export function round(n: number, places = 1) {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Stable deterministic shuffle so SSR and client agree. */
export function seededPick<T>(arr: T[], count: number, seed: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  let s = seed;
  while (copy.length && out.length < count) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    out.push(copy.splice(s % copy.length, 1)[0]);
  }
  return out;
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Normalise Egyptian phone numbers for storage/lookup: 01XXXXXXXXX */
export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/[^\d]/g, "");
  if (digits.startsWith("20") && digits.length >= 12) return `0${digits.slice(2)}`;
  if (digits.startsWith("0")) return digits;
  if (digits.length === 10 && digits.startsWith("1")) return `0${digits}`;
  return digits;
}

export function isValidEgyptPhone(raw: string): boolean {
  const p = normalizePhone(raw);
  return /^01[0125]\d{8}$/.test(p);
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((raw || "").trim());
}
