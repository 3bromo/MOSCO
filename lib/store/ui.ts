"use client";

import { create } from "zustand";

interface Toast {
  id: string;
  message: string;
  tone: "success" | "error" | "info";
}

interface UIState {
  searchOpen: boolean;
  menuOpen: boolean;
  filtersOpen: boolean;
  toasts: Toast[];
  setSearchOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  setFiltersOpen: (v: boolean) => void;
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: string) => void;
}

export const useUI = create<UIState>((set) => ({
  searchOpen: false,
  menuOpen: false,
  filtersOpen: false,
  toasts: [],
  setSearchOpen: (v) => set({ searchOpen: v }),
  setMenuOpen: (v) => set({ menuOpen: v }),
  setFiltersOpen: (v) => set({ filtersOpen: v }),
  toast: (message, tone = "info") => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
