import type { Locale } from "@/lib/i18n/config";

export interface Block {
  heading: string;
  body: string[];
}

type Bilingual<T> = Record<Locale, T>;

export function pick<T>(src: Bilingual<T>, locale: Locale): T {
  return src[locale] ?? src.en;
}

/* -------------------------------------------------------------------- *
 * FAQ
 * -------------------------------------------------------------------- */

/*------------------------------------------------------------------------
 * Shipping
 *------------------------------------------------------------------------*/

export const SHIPPING: Block[] = {
  en: [
    {
      heading: "Dispatch",
      body: [
        "Orders placed before 4:00 PM Cairo time on a working day are picked and packed the same day. Orders placed after that, or on Friday, are dispatched the next working day.",
        "Every order is checked by hand before it is sealed. If a piece does not pass inspection we hold the order and contact you rather than ship something we are not happy with.",
      ],
    },
    {
      heading: "Delivery times",
      body: [
        "Greater Cairo and Giza: 1–3 working days.",
        "Alexandria, the Delta and Canal cities: 2–4 working days.",
        "Upper Egypt, Sinai, the Red Sea and the New Valley: 3–6 working days.",
        "Delivery windows are estimates from our courier partners, not guarantees. Public holidays and extreme weather can add a day.",
      ],
    },
    {
      heading: "Shipping cost",
      body: [
        "Shipping is calculated by governorate and shown before you pay — there are no fees added afterwards.",
        "Orders above the free-shipping threshold shown in your cart ship free anywhere in Egypt.",
      ],
    },
    {
      heading: "Tracking",
      body: [
        "You receive an order number the moment checkout completes. Enter that number together with the phone number on the order at the tracking page to see the current status.",
        "Our courier calls before arriving. If you miss the call they attempt delivery twice more before the parcel returns to us.",
      ],
    },
  ],
};
