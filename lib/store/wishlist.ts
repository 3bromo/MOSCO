"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  ids: string[];
  hydrated: boolean;
  toggle: (id: string) => boolean;
  has: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
}

/**
 * Wishlist lives in localStorage so guests keep it, and is mirrored to the
 * customer record on login (see syncWishlist server action).
 */
export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,
      toggle: (id) => {
        const has = get().ids.includes(id);
        set((s) => ({ ids: has ? s.ids.filter((x) => x !== id) : [...s.ids, id] }));
        void fetch("/api/account/wishlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, action: has ? "remove" : "add" }),
        }).catch(() => {});
        return !has;
      },
      has: (id) => get().ids.includes(id),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: "mosco.wishlist.v1",
      partialize: (s) => ({ ids: s.ids }) as unknown as WishlistState,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
