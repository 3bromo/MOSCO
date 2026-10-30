import type {
  Collection,
  ContactMessage,
  Customer,
  Discount,
  NewsletterSignup,
  Order,
  OrderStatus,
  Product,
  ProductQuery,
  Settings,
} from "./types";

export interface OrderQuery {
  status?: OrderStatus | "all";
  search?: string;
  customerId?: string;
  limit?: number;
}

export interface Repo {
  readonly mode: "local" | "supabase";

  /* products */
  listProducts(q?: ProductQuery): Promise<Product[]>;
  listAllProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  saveProduct(p: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  /* collections */
  listCollections(opts?: { includeHidden?: boolean }): Promise<Collection[]>;
  getCollectionBySlug(slug: string): Promise<Collection | null>;
  saveCollection(c: Collection): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;

  /* customers */
  listCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  getCustomerByEmail(email: string): Promise<Customer | null>;
  saveCustomer(c: Customer): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  /* orders */
  listOrders(q?: OrderQuery): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  getOrderByNumber(num: string): Promise<Order | null>;
  saveOrder(o: Order): Promise<Order>;

  /* discounts */
  listDiscounts(): Promise<Discount[]>;
  getDiscountByCode(code: string): Promise<Discount | null>;
  saveDiscount(d: Discount): Promise<Discount>;
  deleteDiscount(id: string): Promise<void>;

  /* settings */
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<Settings>;

  /* misc */
  addNewsletter(email: string): Promise<void>;
  listNewsletter(): Promise<NewsletterSignup[]>;
  addMessage(m: ContactMessage): Promise<void>;
  listMessages(): Promise<ContactMessage[]>;

  /** Atomically reduce stock for the given product/size pairs. */
  decrementStock(items: { product_id: string; size: string; qty: number }[]): Promise<void>;
}
