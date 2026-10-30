import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "@/lib/auth/password";
import { uid } from "@/lib/utils";
import { buildSeed } from "./seed";
import { filterProducts } from "./query";
import type { OrderQuery, Repo } from "./repo";
import type {
  Collection,
  ContactMessage,
  Customer,
  DatabaseShape,
  Discount,
  NewsletterSignup,
  Order,
  Product,
  ProductQuery,
  Settings,
} from "./types";

/**
 * File-backed store used when Supabase credentials are absent.
 * Writes are serialised through a promise chain and committed atomically
 * (write temp → rename) so a crash can never leave a half-written catalogue.
 */

const DATA_DIR = process.env.MOSCO_DATA_DIR || path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "mosco.json");

type G = typeof globalThis & {
  __moscoDb?: DatabaseShape | null;
  __moscoChain?: Promise<unknown>;
  __moscoLoading?: Promise<DatabaseShape> | null;
};
const g = globalThis as G;

g.__moscoChain ??= Promise.resolve();

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readFromDisk(): Promise<DatabaseShape | null> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as DatabaseShape;
    if (!parsed || !Array.isArray(parsed.products)) return null;
    return parsed;
  } catch {
    return null;
  }
}

let tmpCounter = 0;

async function writeToDisk(db: DatabaseShape) {
  await ensureDir();
  // pid + monotonic counter + randomness: two writes inside the same
  // millisecond can never pick the same temp path.
  tmpCounter = (tmpCounter + 1) % 1_000_000;
  const tmp = `${DB_FILE}.${process.pid}.${tmpCounter}.${Math.random()
    .toString(36)
    .slice(2, 8)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

/**
 * Single-flight loader. Several server components resolve in parallel on first
 * paint; without this they would each seed and race to rename their temp file.
 */
async function load(): Promise<DatabaseShape> {
  if (g.__moscoDb) return g.__moscoDb;
  if (g.__moscoLoading) return g.__moscoLoading;

  g.__moscoLoading = (async () => {
    const disk = await readFromDisk();
    if (disk) {
      g.__moscoDb = disk;
      return disk;
    }
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@moscow.store").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "MoscowAdmin!2026";
    const seeded = buildSeed(await hashPassword(adminPassword), adminEmail);
    await writeToDisk(seeded);
    g.__moscoDb = seeded;
    return seeded;
  })();

  try {
    return await g.__moscoLoading;
  } finally {
    g.__moscoLoading = null;
  }
}

/** Serialises mutations; always persists before resolving. */
function mutate<T>(fn: (db: DatabaseShape) => T | Promise<T>): Promise<T> {
  const next = g.__moscoChain!.then(async () => {
    const db = await load();
    const result = await fn(db);
    db.settings.updated_at = db.settings.updated_at || new Date().toISOString();
    await writeToDisk(db);
    g.__moscoDb = db;
    return result;
  });
  g.__moscoChain = next.catch(() => undefined);
  return next;
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const localRepo: Repo = {
  mode: "local",

  /* ------------------------------ products ----------------------------- */
  async listProducts(q: ProductQuery = {}) {
    const db = await load();
    return clone(filterProducts(db.products, q));
  },
  async listAllProducts() {
    const db = await load();
    return clone(db.products);
  },
  async getProductBySlug(slug) {
    const db = await load();
    return clone(db.products.find((p) => p.slug === slug) ?? null);
  },
  async getProductById(id) {
    const db = await load();
    return clone(db.products.find((p) => p.id === id) ?? null);
  },
  async saveProduct(p: Product) {
    return mutate((db) => {
      const i = db.products.findIndex((x) => x.id === p.id);
      if (i === -1) db.products.push(p);
      else db.products[i] = p;
      return clone(p);
    });
  },
  async deleteProduct(id) {
    await mutate((db) => {
      db.products = db.products.filter((p) => p.id !== id);
    });
  },

  /* ---------------------------- collections ---------------------------- */
  async listCollections(opts) {
    const db = await load();
    const list = opts?.includeHidden ? db.collections : db.collections.filter((c) => c.visible);
    return clone([...list].sort((a, b) => a.position - b.position));
  },
  async getCollectionBySlug(slug) {
    const db = await load();
    return clone(db.collections.find((c) => c.slug === slug) ?? null);
  },
  async saveCollection(c) {
    return mutate((db) => {
      const i = db.collections.findIndex((x) => x.id === c.id);
      if (i === -1) db.collections.push(c);
      else db.collections[i] = c;
      return clone(c);
    });
  },
  async deleteCollection(id) {
    await mutate((db) => {
      db.collections = db.collections.filter((c) => c.id !== id);
    });
  },

  /* ----------------------------- customers ----------------------------- */
  async listCustomers() {
    const db = await load();
    return clone(
      [...db.customers].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    );
  },
  async getCustomerById(id) {
    const db = await load();
    return clone(db.customers.find((c) => c.id === id) ?? null);
  },
  async getCustomerByEmail(email) {
    const db = await load();
    const e = email.trim().toLowerCase();
    return clone(db.customers.find((c) => c.email.toLowerCase() === e) ?? null);
  },
  async saveCustomer(c: Customer) {
    return mutate((db) => {
      const i = db.customers.findIndex((x) => x.id === c.id);
      if (i === -1) db.customers.push(c);
      else db.customers[i] = c;
      return clone(c);
    });
  },
  async deleteCustomer(id) {
    await mutate((db) => {
      db.customers = db.customers.filter((c) => c.id !== id || c.role === "admin");
    });
  },

  /* ------------------------------- orders ------------------------------ */
  async listOrders(q: OrderQuery = {}) {
    const db = await load();
    let out = [...db.orders];
    if (q.status && q.status !== "all") out = out.filter((o) => o.status === q.status);
    if (q.customerId) out = out.filter((o) => o.customer_id === q.customerId);
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
    out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (q.limit) out = out.slice(0, q.limit);
    return clone(out);
  },
  async getOrderById(id) {
    const db = await load();
    return clone(db.orders.find((o) => o.id === id) ?? null);
  },
  async getOrderByNumber(num) {
    const db = await load();
    const n = num.trim().toUpperCase();
    return clone(db.orders.find((o) => o.order_number.toUpperCase() === n) ?? null);
  },
  async saveOrder(o: Order) {
    return mutate((db) => {
      const i = db.orders.findIndex((x) => x.id === o.id);
      if (i === -1) db.orders.push(o);
      else db.orders[i] = o;
      return clone(o);
    });
  },

  /* ----------------------------- discounts ----------------------------- */
  async listDiscounts() {
    const db = await load();
    return clone(db.discounts);
  },
  async getDiscountByCode(code) {
    const db = await load();
    const c = code.trim().toUpperCase();
    return clone(db.discounts.find((d) => d.code.toUpperCase() === c) ?? null);
  },
  async saveDiscount(d: Discount) {
    return mutate((db) => {
      const i = db.discounts.findIndex((x) => x.id === d.id);
      if (i === -1) db.discounts.push(d);
      else db.discounts[i] = d;
      return clone(d);
    });
  },
  async deleteDiscount(id) {
    await mutate((db) => {
      db.discounts = db.discounts.filter((d) => d.id !== id);
    });
  },

  /* ------------------------------ settings ----------------------------- */
  async getSettings() {
    const db = await load();
    return clone(db.settings);
  },
  async saveSettings(s: Settings) {
    return mutate((db) => {
      db.settings = { ...s, updated_at: new Date().toISOString() };
      return clone(db.settings);
    });
  },

  /* -------------------------------- misc ------------------------------- */
  async addNewsletter(email) {
    await mutate((db) => {
      const e = email.trim().toLowerCase();
      if (db.newsletter.some((n) => n.email === e)) return;
      const row: NewsletterSignup = { id: uid("nws"), email: e, created_at: new Date().toISOString() };
      db.newsletter.push(row);
    });
  },
  async listNewsletter() {
    const db = await load();
    return clone(db.newsletter);
  },
  async addMessage(m: ContactMessage) {
    await mutate((db) => {
      db.messages.push(m);
    });
  },
  async listMessages() {
    const db = await load();
    return clone(
      [...db.messages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    );
  },

  async decrementStock(items) {
    await mutate((db) => {
      for (const it of items) {
        const p = db.products.find((x) => x.id === it.product_id);
        if (!p) continue;
        const row = p.sizes.find((s) => s.size === it.size);
        if (!row) continue;
        row.stock = Math.max(0, (row.stock || 0) - it.qty);
        p.sold_count = (p.sold_count || 0) + it.qty;
        p.updated_at = new Date().toISOString();
      }
    });
  },
};

/** Exposed for the admin "reset demo data" action and tests. */
export async function resetLocalDb() {
  g.__moscoDb = null;
  try {
    await fs.unlink(DB_FILE);
  } catch {
    /* already gone */
  }
  await load();
}

export type { Collection, Customer, Discount, Order, Product, Settings };
