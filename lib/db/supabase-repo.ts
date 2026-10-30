import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { uid } from "@/lib/utils";
import { filterProducts } from "./query";
import { seedSettings } from "./seed";
import type { OrderQuery, Repo } from "./repo";
import type {
  Collection,
  ContactMessage,
  Customer,
  Discount,
  NewsletterSignup,
  Order,
  Product,
  ProductQuery,
  Settings,
} from "./types";

/**
 * Supabase adapter. Rows map 1:1 to the domain model (arrays/objects live in
 * jsonb columns), so the mapping layer stays thin and the same `Repo` contract
 * is honoured byte-for-byte against the local file store.
 *
 * Catalogue-scale note: product filtering happens in memory after a single
 * indexed fetch. For an independent label (hundreds of SKUs) this is faster
 * than round-tripping every facet combination, and guarantees identical
 * filter/sort semantics across both adapters.
 */

const sb = () => supabaseAdmin();

function asProduct(r: Record<string, unknown>): Product {
  return {
    ...(r as unknown as Product),
    details: (r.details as string[]) ?? [],
    details_ar: (r.details_ar as string[]) ?? [],
    collections: (r.collections as string[]) ?? [],
    images: (r.images as Product["images"]) ?? [],
    colors: (r.colors as Product["colors"]) ?? [],
    sizes: (r.sizes as Product["sizes"]) ?? [],
    badges: (r.badges as Product["badges"]) ?? [],
    popularity: Number(r.popularity ?? 0),
    sold_count: Number(r.sold_count ?? 0),
    price: Number(r.price ?? 0),
    compare_at_price: r.compare_at_price == null ? null : Number(r.compare_at_price),
    featured: Boolean(r.featured),
  };
}

function asOrder(r: Record<string, unknown>): Order {
  return {
    ...(r as unknown as Order),
    items: (r.items as Order["items"]) ?? [],
    timeline: (r.timeline as Order["timeline"]) ?? [],
    subtotal: Number(r.subtotal ?? 0),
    shipping: Number(r.shipping ?? 0),
    discount: Number(r.discount ?? 0),
    total: Number(r.total ?? 0),
  };
}

function asCustomer(r: Record<string, unknown>): Customer {
  return {
    ...(r as unknown as Customer),
    addresses: (r.addresses as Customer["addresses"]) ?? [],
    wishlist: (r.wishlist as string[]) ?? [],
  };
}

async function allProducts(): Promise<Product[]> {
  const { data, error } = await sb().from("products").select("*");
  if (error) throw new Error(`Supabase products: ${error.message}`);
  return (data ?? []).map(asProduct);
}

export const supabaseRepo: Repo = {
  mode: "supabase",

  /* ------------------------------ products ----------------------------- */
  async listProducts(q: ProductQuery = {}) {
    return filterProducts(await allProducts(), q);
  },
  async listAllProducts() {
    return allProducts();
  },
  async getProductBySlug(slug) {
    const { data, error } = await sb().from("products").select("*").eq("slug", slug).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? asProduct(data) : null;
  },
  async getProductById(id) {
    const { data, error } = await sb().from("products").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? asProduct(data) : null;
  },
  async saveProduct(p) {
    const { data, error } = await sb().from("products").upsert(p).select().single();
    if (error) throw new Error(error.message);
    return asProduct(data);
  },
  async deleteProduct(id) {
    const { error } = await sb().from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  /* ---------------------------- collections ---------------------------- */
  async listCollections(opts) {
    let q = sb().from("collections").select("*").order("position", { ascending: true });
    if (!opts?.includeHidden) q = q.eq("visible", true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as Collection[];
  },
  async getCollectionBySlug(slug) {
    const { data, error } = await sb()
      .from("collections")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Collection) ?? null;
  },
  async saveCollection(c) {
    const { data, error } = await sb().from("collections").upsert(c).select().single();
    if (error) throw new Error(error.message);
    return data as Collection;
  },
  async deleteCollection(id) {
    const { error } = await sb().from("collections").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  /* ----------------------------- customers ----------------------------- */
  async listCustomers() {
    const { data, error } = await sb()
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(asCustomer);
  },
  async getCustomerById(id) {
    const { data, error } = await sb().from("customers").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? asCustomer(data) : null;
  },
  async getCustomerByEmail(email) {
    const { data, error } = await sb()
      .from("customers")
      .select("*")
      .ilike("email", email.trim())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? asCustomer(data) : null;
  },
  async saveCustomer(c) {
    const { data, error } = await sb().from("customers").upsert(c).select().single();
    if (error) throw new Error(error.message);
    return asCustomer(data);
  },
  async deleteCustomer(id) {
    const { error } = await sb().from("customers").delete().eq("id", id).neq("role", "admin");
    if (error) throw new Error(error.message);
  },

  /* ------------------------------- orders ------------------------------ */
  async listOrders(q: OrderQuery = {}) {
    let query = sb().from("orders").select("*").order("created_at", { ascending: false });
    if (q.status && q.status !== "all") query = query.eq("status", q.status);
    if (q.customerId) query = query.eq("customer_id", q.customerId);
    if (q.limit) query = query.limit(q.limit);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    let out = (data ?? []).map(asOrder);
    if (q.search?.trim()) {
      const s = q.search.toLowerCase().trim();
      out = out.filter(
        (o) =>
          o.order_number.toLowerCase().includes(s) ||
          o.full_name.toLowerCase().includes(s) ||
          o.phone.includes(s) ||
          (o.email ?? "").toLowerCase().includes(s),
      );
    }
    return out;
  },
  async getOrderById(id) {
    const { data, error } = await sb().from("orders").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? asOrder(data) : null;
  },
  async getOrderByNumber(num) {
    const { data, error } = await sb()
      .from("orders")
      .select("*")
      .eq("order_number", num.trim().toUpperCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? asOrder(data) : null;
  },
  async saveOrder(o) {
    const { data, error } = await sb().from("orders").upsert(o).select().single();
    if (error) throw new Error(error.message);
    return asOrder(data);
  },

  /* ----------------------------- discounts ----------------------------- */
  async listDiscounts() {
    const { data, error } = await sb().from("discounts").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []) as Discount[];
  },
  async getDiscountByCode(code) {
    const { data, error } = await sb()
      .from("discounts")
      .select("*")
      .ilike("code", code.trim())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Discount) ?? null;
  },
  async saveDiscount(d) {
    const { data, error } = await sb().from("discounts").upsert(d).select().single();
    if (error) throw new Error(error.message);
    return data as Discount;
  },
  async deleteDiscount(id) {
    const { error } = await sb().from("discounts").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  /* ------------------------------ settings ----------------------------- */
  async getSettings() {
    const { data, error } = await sb()
      .from("settings")
      .select("*")
      .eq("id", "settings")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      const fresh = seedSettings();
      await sb().from("settings").upsert(fresh);
      return fresh;
    }
    const s = data as Settings;
    return {
      ...s,
      shipping_rates: s.shipping_rates ?? [],
      banners: s.banners ?? [],
      fit_ai: s.fit_ai ?? seedSettings().fit_ai,
    };
  },
  async saveSettings(s) {
    const row = { ...s, id: "settings", updated_at: new Date().toISOString() };
    const { data, error } = await sb().from("settings").upsert(row).select().single();
    if (error) throw new Error(error.message);
    return data as Settings;
  },

  /* -------------------------------- misc ------------------------------- */
  async addNewsletter(email) {
    const row: NewsletterSignup = {
      id: uid("nws"),
      email: email.trim().toLowerCase(),
      created_at: new Date().toISOString(),
    };
    const { error } = await sb().from("newsletter").upsert(row, { onConflict: "email" });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  },
  async listNewsletter() {
    const { data, error } = await sb().from("newsletter").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []) as NewsletterSignup[];
  },
  async addMessage(m) {
    const { error } = await sb().from("messages").insert(m);
    if (error) throw new Error(error.message);
  },
  async listMessages() {
    const { data, error } = await sb()
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ContactMessage[];
  },

  async decrementStock(items) {
    // One RPC round-trip keeps the decrement atomic under concurrent checkouts.
    const { error } = await sb().rpc("mosco_decrement_stock", { items });
    if (!error) return;

    // Fallback for projects that haven't applied the function yet.
    for (const it of items) {
      const p = await supabaseRepo.getProductById(it.product_id);
      if (!p) continue;
      const sizes = p.sizes.map((s) =>
        s.size === it.size ? { ...s, stock: Math.max(0, (s.stock || 0) - it.qty) } : s,
      );
      await sb()
        .from("products")
        .update({
          sizes,
          sold_count: (p.sold_count || 0) + it.qty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
    }
  },
};
