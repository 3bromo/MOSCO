/* ------------------------------------------------------------------ *
 * MOSCOW domain model
 * Shared by both storage adapters (local JSON file + Supabase).
 * ------------------------------------------------------------------ */

export type GarmentType = "top" | "bottom" | "set" | "accessory" | "footwear";
export type IntrinsicFit = "slim" | "regular" | "oversized";
export type ProductStatus = "active" | "draft" | "archived";
export type Badge = "new" | "bestseller" | "sale" | "limited";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export type PaymentMethod = "cod" | "instapay";
export type PaymentStatus = "unpaid" | "proof_submitted" | "paid" | "refunded";

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  alt_ar?: string;
  position: number;
  /** Optional link to a colour variant name so the gallery can filter. */
  color?: string | null;
}

export interface ProductColor {
  name: string;
  name_ar?: string;
  hex: string;
}

/**
 * Per-product size row. Garment measurements are stored in CENTIMETRES and are
 * specific to this product — there is deliberately no global size chart.
 * Any field may be absent; Fit AI degrades gracefully and says so.
 */
export interface SizeRow {
  size: string;
  stock: number;
  /** Garment measurements, flat, in cm */
  chest?: number | null;
  shoulder?: number | null;
  length?: number | null;
  sleeve?: number | null;
  waist?: number | null;
  hip?: number | null;
  inseam?: number | null;
  thigh?: number | null;
  legOpening?: number | null;
  /** Body ranges this size is drafted for (cm / kg) — optional. */
  bodyHeightMin?: number | null;
  bodyHeightMax?: number | null;
  bodyWeightMin?: number | null;
  bodyWeightMax?: number | null;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  name_ar?: string;
  subtitle?: string;
  subtitle_ar?: string;
  description: string;
  description_ar?: string;
  details: string[];
  details_ar?: string[];
  price: number;
  compare_at_price?: number | null;
  category: string;
  collections: string[];
  images: ProductImage[];
  colors: ProductColor[];
  sizes: SizeRow[];
  garment_type: GarmentType;
  /** The cut the product was drafted to — Fit AI offsets against this. */
  intrinsic_fit: IntrinsicFit;
  size_note?: string;
  size_note_ar?: string;
  badges: Badge[];
  popularity: number;
  sold_count: number;
  status: ProductStatus;
  featured: boolean;
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
}

export type CollectionKind = "category" | "collection";

export interface Collection {
  id: string;
  slug: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  image?: string | null;
  kind: CollectionKind;
  position: number;
  featured: boolean;
  visible: boolean;
  /** Auto-membership rule: products carrying this badge join automatically. */
  auto_badge?: Badge | null;
  created_at: string;
}

export interface Address {
  id: string;
  label: string;
  city: string;
  address: string;
  notes?: string;
  is_default: boolean;
}

export type Role = "customer" | "admin";

export interface Customer {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  password_hash: string;
  role: Role;
  addresses: Address[];
  wishlist: string[];
  created_at: string;
  updated_at: string;
}

export type PublicCustomer = Omit<Customer, "password_hash">;

export interface OrderItem {
  product_id: string;
  slug: string;
  name: string;
  name_ar?: string;
  image: string;
  size: string;
  color?: string | null;
  qty: number;
  unit_price: number;
}

export interface TimelineEntry {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string | null;
  full_name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  discount_code?: string | null;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_proof_url?: string | null;
  status: OrderStatus;
  timeline: TimelineEntry[];
  created_at: string;
  updated_at: string;
}

export type DiscountType = "percent" | "fixed" | "free_shipping";

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  min_subtotal: number;
  active: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  usage_limit?: number | null;
  used: number;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  title_ar?: string;
  subtitle?: string;
  subtitle_ar?: string;
  image?: string | null;
  cta_label?: string;
  cta_label_ar?: string;
  cta_href?: string;
  position: number;
  visible: boolean;
  /** Where it renders: a strip under the header, or a homepage block. */
  placement: "announcement" | "home";
}

export interface ShippingRate {
  city: string;
  city_ar?: string;
  cost: number;
}

export interface FitAiSettings {
  enabled: boolean;
  show_confidence: boolean;
  /** Extra ease (cm) added to the body measurement per preference. */
  ease_slim: number;
  ease_regular: number;
  ease_oversized: number;
  /** cm of slack before confidence degrades. */
  tolerance: number;
  disclaimer?: string;
  disclaimer_ar?: string;
}

export interface Settings {
  id: "settings";
  brand_name: string;
  tagline: string;
  tagline_ar?: string;
  contact_email: string;
  contact_phone: string;
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  address_line?: string;
  address_line_ar?: string;
  /** Commerce */
  shipping_flat: number;
  free_shipping_threshold: number;
  shipping_rates: ShippingRate[];
  /** InstaPay */
  instapay_handle: string;
  instapay_name: string;
  instapay_instructions: string;
  instapay_instructions_ar?: string;
  /** Homepage editorial copy (admin-editable) */
  home_hero_title: string;
  home_hero_title_ar?: string;
  home_hero_sub: string;
  home_hero_sub_ar?: string;
  home_story_title: string;
  home_story_title_ar?: string;
  home_story_body: string;
  home_story_body_ar?: string;
  home_story_image?: string | null;
  about_body?: string;
  about_body_ar?: string;
  banners: Banner[];
  fit_ai: FitAiSettings;
  updated_at: string;
}

export interface NewsletterSignup {
  id: string;
  email: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface DatabaseShape {
  products: Product[];
  collections: Collection[];
  customers: Customer[];
  orders: Order[];
  discounts: Discount[];
  newsletter: NewsletterSignup[];
  messages: ContactMessage[];
  settings: Settings;
}

/* ---------------------------- query helpers --------------------------- */

export interface ProductQuery {
  search?: string;
  category?: string | string[];
  collection?: string | string[];
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: "newest" | "price-asc" | "price-desc" | "popular";
  includeDrafts?: boolean;
  limit?: number;
  offset?: number;
}

export function totalStock(p: Pick<Product, "sizes">): number {
  return p.sizes.reduce((s, r) => s + Math.max(0, r.stock || 0), 0);
}

export function stockForSize(p: Pick<Product, "sizes">, size: string): number {
  return Math.max(0, p.sizes.find((r) => r.size === size)?.stock ?? 0);
}
