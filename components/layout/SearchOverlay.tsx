"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { localized } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

interface Hit {
  id: string;
  slug: string;
  name: string;
  name_ar?: string;
  price: number;
  image: string;
}

export default function SearchOverlay() {
  const { t, locale } = useI18n();
  const { searchOpen, setSearchOpen } = useUI();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => inputRef.current?.focus(), 120);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, setSearchOpen]);

  // Debounced type-ahead against the catalogue API.
  useEffect(() => {
    if (!searchOpen) return;
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        const data = (await res.json()) as { products: Hit[] };
        setHits(data.products ?? []);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      ctrl.abort();
      window.clearTimeout(id);
    };
  }, [q, searchOpen]);

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const term = q.trim();
      if (!term) return;
      setSearchOpen(false);
      router.push(`/shop?q=${encodeURIComponent(term)}`);
    },
    [q, router, setSearchOpen],
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] transition-opacity duration-400",
        searchOpen ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t("nav.search")}
    >
      <div
        className="absolute inset-0 bg-ice-950/40 backdrop-blur-md"
        onClick={() => setSearchOpen(false)}
      />

      <div
        className={cn(
          "relative mx-auto w-full max-w-3xl bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
          searchOpen ? "translate-y-0" : "-translate-y-6",
        )}
      >
        <form onSubmit={submit} className="flex items-center gap-3 border-b border-silver-200 px-5">
          <Search className="h-5 w-5 shrink-0 text-ice-500" strokeWidth={1.5} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("shop.searchPlaceholder")}
            className="h-16 flex-1 bg-transparent text-[16px] outline-none placeholder:text-silver-500"
            autoComplete="off"
            // 16px font-size avoids iOS zoom-on-focus
            style={{ fontSize: 16 }}
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-ice-100"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {loading && (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="skeleton h-20 w-16 rounded-md" />
                  <div className="flex-1 space-y-2 py-2">
                    <div className="skeleton h-3.5 w-1/2 rounded" />
                    <div className="skeleton h-3 w-1/4 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && q.trim().length >= 2 && hits.length === 0 && (
            <p className="p-8 text-center text-sm text-ice-600">{t("shop.noResults")}</p>
          )}

          {!loading && hits.length > 0 && (
            <ul className="divide-y divide-silver-200">
              {hits.map((h) => (
                <li key={h.id}>
                  <Link
                    href={`/product/${h.slug}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-ice-50"
                  >
                    <div className="relative aspect-3/4 w-14 shrink-0 overflow-hidden rounded bg-ice-100">
                      <Image
                        src={h.image}
                        alt={localized(h, "name", locale)}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <span className="flex-1 text-[14px]">{localized(h, "name", locale)}</span>
                    <span className="text-[13px] tabular-nums text-ice-700">
                      {formatMoney(h.price, locale)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!loading && q.trim().length < 2 && (
            <div className="p-5">
              <p className="eyebrow mb-3">{t("nav.collections")}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["new-arrivals", t("nav.newArrivals")],
                  ["best-sellers", t("nav.bestSellers")],
                  ["denim", t("nav.denim")],
                  ["jackets", t("nav.jackets")],
                  ["pants", t("nav.pants")],
                  ["matching-sets", t("nav.sets")],
                ].map(([slug, label]) => (
                  <Link
                    key={slug}
                    href={`/collections/${slug}`}
                    onClick={() => setSearchOpen(false)}
                    className="rounded-full border border-silver-300 px-3.5 py-1.5 text-[12px] text-ice-700 transition-colors hover:border-ice-900 hover:text-ice-900"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
