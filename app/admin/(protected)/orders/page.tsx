import Link from "next/link";
import { Package } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import OrderStatusBadge from "@/components/account/OrderStatusBadge";
import { db } from "@/lib/db";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/db/types";
import { translate } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = (ORDER_STATUSES as string[]).includes(sp.status ?? "")
    ? (sp.status as OrderStatus)
    : "all";

  const orders = await db().listOrders({ status, search: sp.q });
  const all = await db().listOrders();

  const counts = new Map<string, number>();
  for (const o of all) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);

  const filters = [
    { id: "all", label: "All", n: all.length },
    ...ORDER_STATUSES.map((s) => ({
      id: s,
      label: translate("en", `status.${s}`),
      n: counts.get(s) ?? 0,
    })),
  ];

  return (
    <>
      <AdminHeader
        title="Orders"
        subtitle="Change a status and the customer sees it immediately on the tracking page."
      />

      <form className="mb-5" action="/admin/orders">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search by order number, name or phone…"
          className="field max-w-sm"
        />
      </form>

      <div className="no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
        {filters.map((f) => (
          <Link
            key={f.id}
            href={f.id === "all" ? "/admin/orders" : `/admin/orders?status=${f.id}`}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-2 text-[12.5px] transition-colors",
              status === f.id
                ? "bg-ice-900 text-white"
                : "bg-ice-50 text-ice-700 hover:bg-ice-100",
            )}
          >
            {f.label}
            <span className="ms-1.5 tabular-nums opacity-60">{f.n}</span>
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-silver-300 p-12 text-center">
          <Package className="mx-auto h-7 w-7 text-ice-400" strokeWidth={1.25} />
          <p className="mt-3 text-[13.5px] text-ice-600">No orders match this view.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-silver-200 bg-white">
          <ul className="divide-y divide-silver-200">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 p-4 transition-colors hover:bg-ice-50/70"
                >
                  <span className="font-mono text-[12.5px] font-medium" dir="ltr">
                    {o.order_number}
                  </span>
                  <OrderStatusBadge status={o.status} label={translate("en", `status.${o.status}`)} />
                  <div className="min-w-[140px] flex-1">
                    <p className="truncate text-[13.5px]">{o.full_name}</p>
                    <p className="truncate text-[11.5px] text-ice-500" dir="ltr">
                      {o.phone} · {o.city}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10.5px] uppercase tracking-[0.08em] ring-1 ring-inset",
                      o.payment_method === "instapay"
                        ? "bg-sky-50 text-sky-800 ring-sky-200"
                        : "bg-ice-50 text-ice-700 ring-ice-200",
                    )}
                  >
                    {o.payment_method === "instapay" ? "InstaPay" : "COD"}
                  </span>
                  <span className="hidden whitespace-nowrap text-[12px] text-ice-500 sm:inline">
                    {new Date(o.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="w-24 text-end text-[13.5px] font-medium tabular-nums">
                    {formatMoney(o.total, "en")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
