"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  /** product_id + size + colour — the unique line identity. */
  key: string;
  product_id: string;
  slug: string;
  name: string;
  name_ar?: string;
  image: string;
  size: string;
  color?: string | null;
  qty: number;
  unit_price: number;
  /** Stock cap at the time of adding — re-validated server-side at checkout. */
  max: number;
}

export type AddLine = Omit<CartLine, "key" | "qty"> & { qty?: number };

interface CartState {
  lines: CartLine[];
  open: boolean;
  lastAdded: string | null;
  hydrated: boolean;
  add: (line: AddLine) => { ok: boolean; capped: boolean };
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => { capped: boolean };
  setSize: (key: string, size: string, max: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  count: () => number;
  subtotal: () => number;
}

export const lineKey = (productId: string, size: string, color?: string | null) =>
  `${productId}::${size}::${color ?? ""}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      open: false,
      lastAdded: null,
      hydrated: false,

      add: (line) => {
        const key = lineKey(line.product_id, line.size, line.color);
        const qty = Math.max(1, line.qty ?? 1);
        let capped = false;

        set((state) => {
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            const next = existing.qty + qty;
            const clamped = Math.min(next, Math.max(1, line.max));
            capped = clamped < next;
            return {
              lines: state.lines.map((l) => (l.key === key ? { ...l, qty: clamped, max: line.max } : l)),
              lastAdded: key,
            };
          }
          const clamped = Math.min(qty, Math.max(1, line.max));
          capped = clamped < qty;
          return { lines: [...state.lines, { ...line, key, qty: clamped }], lastAdded: key };
        });

        return { ok: true, capped };
      },

      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),

      setQty: (key, qty) => {
        let capped = false;
        set((s) => ({
          lines: s.lines.flatMap((l) => {
            if (l.key !== key) return [l];
            if (qty <= 0) return [];
            const clamped = Math.min(qty, Math.max(1, l.max));
            capped = clamped < qty;
            return [{ ...l, qty: clamped }];
          }),
        }));
        return { capped };
      },

      setSize: (key, size, max) =>
        set((s) => {
          const line = s.lines.find((l) => l.key === key);
          if (!line) return s;
          const newKey = lineKey(line.product_id, size, line.color);
          const merged = s.lines.find((l) => l.key === newKey && l.key !== key);
          if (merged) {
            return {
              lines: s.lines
                .filter((l) => l.key !== key)
                .map((l) =>
                  l.key === newKey
                    ? { ...l, qty: Math.min(l.qty + line.qty, Math.max(1, max)), max }
                    : l,
                ),
            };
          }
          return {
            lines: s.lines.map((l) =>
              l.key === key
                ? { ...l, key: newKey, size, max, qty: Math.min(l.qty, Math.max(1, max)) }
                : l,
            ),
          };
        }),

      clear: () => set({ lines: [], lastAdded: null }),
      setOpen: (open) => set({ open }),

      count: () => get().lines.reduce((n, l) => n + l.qty, 0),
      subtotal: () => get().lines.reduce((n, l) => n + l.qty * l.unit_price, 0),
    }),
    {
      name: "mosco.cart.v1",
      partialize: (s) => ({ lines: s.lines }) as unknown as CartState,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
