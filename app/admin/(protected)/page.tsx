import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Mail,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import OrderStatusBadge from "@/components/account/OrderStatusBadge";
import { db, dbMode, totalStock } from "@/lib/db";
import { translate } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const LOW_STOCK = 4;

export default async function AdminOverview() {
  const repo = db();
  const [orders, products, customers, messages] = await Promise.all([
    repo.listOrders(),
    repo.listAllProducts(),
    repo.listCustomers(),
    repo.listMessages(),
  ]);

  const live = orders.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((n, o) => n + o.total, 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const unread = messages.filter((m) => !m.read).length;

  const lowStock = products
    .filter((p) => p.status === "active")
    .flatMap((p) =>
      p.sizes
        .filter((s) => s.stock <= LOW_STOCK)
        .map((s) => ({ product: p, size: s.size, stock: s.stock })),
    )
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8);

  const stats = [
    {
      icon: Banknote,
      label: "Revenue",
      value: formatMoney(revenue, "en"),
      hint: `${live.length} paid-eligible orders`,
    },
    {
      icon: ShoppingBag,
      label: "Orders",
      value: String(orders.length),
      hint: pending ? `${pending} awaiting action` : "All triaged",
      href: "/admin/orders",
    },
    {
      icon: Package,
      label: "Live products",
      value: String(products.filter((p) => p.status === "active").length),
      hint: `${products.length} total incl. drafts`,
      href: "/admin/products",
    },
    {
      icon: Users,
      label: "Customers",
      value: String(customers.filter((c) => c.role === "customer").length),
      href: "/admin/customers",
    },
  ];

  return (
    <>
      <AdminHeader
        title="Overview"
        subtitle={
          dbMode() === "supabase"
            ? "Connected to Supabase. Every change below writes to your project."
            : "Running on the local JSON database at data/mosco.json. Add Supabase keys to .env.local to switch — no code changes needed."
        }
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const inner = (
            <>
              <s.icon className="h-4.5 w-4.5 text-ice-500" strokeWidth={1.5} />
              <dd className="mt-3 font-display text-2xl tabular-nums leading-none">{s.value}</dd>
              <dt className="mt-1.5 text-[12px] text-ice-600">{s.label}</dt>
              {s.hint && <p className="mt-0.5 text-[11px] text-ice-400">{s.hint}</p>}
            </>
          );
          return s.href ? (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-lg border border-silver-200 bg-white p-5 transition-colors hover:border-ice-400"
            >
              {inner}
            </Link>
          ) : (
            <div key={s.label} className="rounded-lg border border-silver-200 bg-white p-5">
              {inner}
            </div>
          );
        })}
      </dl>

      {unread > 0 && (
        <Link
          href="/admin/messages"
          className="mt-4 flex items-center gap-3 rounded-lg border border-ice-300 bg-ice-50 p-4 transition-colors hover:border-ice-500"
        >
          <Mail className="h-4.5 w-4.5 shrink-0 text-ice-700" strokeWidth={1.5} />
          <span className="text-[13.5px] text-ice-800">
            {unread} unread customer {unread === 1 ? "message" : "messages"}
          </span>
          <ArrowRight className="ms-auto h-4 w-4 text-ice-600 rtl:rotate-180" strokeWidth={1.75} />
        </Link>
      )}

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        {/* recent orders */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg uppercase tracking-tight">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-[12.5px] text-ice-700 underline underline-offset-4 hover:text-ice-900"
            >
              View all
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="rounded-lg border border-dashed border-silver-300 p-8 text-center text-[13.5px] text-ice-500">
              No orders yet.
            </p>
          ) : (
            <ul className="divide-y divide-silver-200 overflow-hidden rounded-lg border border-silver-200 bg-white">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition-colors hover:bg-ice-50/70"
                  >
                    <span className="font-mono text-[12.5px] font-medium" dir="ltr">
                      {o.order_number}
                    </span>
                    <OrderStatusBadge status={o.status} label={translate("en", `status.${o.status}`)} />
                    <span className="truncate text-[13px] text-ice-600">{o.full_name}</span>
                    <span className="ms-auto whitespace-nowrap text-[13px] font-medium tabular-nums">
                      {formatMoney(o.total, "en")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* low stock */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg uppercase tracking-tight">Low stock</h2>
            <span className="text-[12px] text-ice-500">≤ {LOW_STOCK} units</span>
          </div>

          {lowStock.length === 0 ? (
            <p className="rounded-lg border border-dashed border-silver-300 p-8 text-center text-[13.5px] text-ice-500">
              Every size is comfortably stocked.
            </p>
          ) : (
            <ul className="divide-y divide-silver-200 overflow-hidden rounded-lg border border-silver-200 bg-white">
              {lowStock.map((row) => (
                <li key={`${row.product.id}-${row.size}`}>
                  <Link
                    href={`/admin/products/${row.product.id}`}
                    className="flex items-center gap-3 p-3 transition-colors hover:bg-ice-50/70"
                  >
                    <div className="relative aspect-3/4 w-9 shrink-0 overflow-hidden rounded bg-ice-100">
                      {row.product.images[0] && (
                        <Image
                          src={row.product.images[0].url}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[13px]">{row.product.name}</span>
                    <span className="rounded bg-ice-100 px-2 py-0.5 text-[11.5px] tabular-nums">
                      {row.size}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[12.5px] font-medium tabular-nums ${
                        row.stock === 0 ? "text-red-600" : "text-amber-700"
                      }`}
                    >
                      {row.stock === 0 && <AlertTriangle className="h-3 w-3" strokeWidth={2} />}
                      {row.stock}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 rounded-lg border border-silver-200 bg-white p-4">
            <p className="flex items-center gap-2 text-[12.5px] text-ice-600">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.6} />
              Total units across the catalogue:{" "}
              <span className="font-medium tabular-nums text-ice-900">
                {products.reduce((n, p) => n + totalStock(p), 0)}
              </span>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
