import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import OrderStatusControl from "@/components/admin/OrderStatusControl";
import OrderTimeline from "@/components/order/OrderTimeline";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db().getOrderById(id);
  if (!order) notFound();

  return (
    <>
      <AdminHeader
        title={order.order_number}
        subtitle={`Placed ${new Date(order.created_at).toLocaleString("en-GB")}`}
        back={{ href: "/admin/orders", label: "Orders" }}
      />

      <div className="grid gap-7 xl:grid-cols-[1fr_340px]">
        <div className="space-y-7">
          <section className="rounded-lg border border-silver-200 bg-white p-5 sm:p-6">
            <h2 className="font-display text-[15px] uppercase tracking-tight">Items</h2>
            <ul className="mt-4 divide-y divide-silver-200">
              {order.items.map((it, i) => (
                <li key={`${it.product_id}-${it.size}-${i}`} className="flex gap-4 py-4 first:pt-0">
                  <Link
                    href={`/admin/products/${it.product_id}`}
                    className="relative aspect-3/4 w-14 shrink-0 overflow-hidden rounded bg-ice-100"
                  >
                    {it.image && (
                      <Image src={it.image} alt="" fill sizes="56px" className="object-cover" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${it.product_id}`}
                      className="text-[14px] hover:underline"
                    >
                      {it.name}
                    </Link>
                    <p className="mt-1 text-[12.5px] text-ice-500">
                      Size {it.size}
                      {it.color ? ` · ${it.color}` : ""} · ×{it.qty}
                    </p>
                  </div>
                  <span className="text-[14px] tabular-nums">
                    {formatMoney(it.unit_price * it.qty, "en")}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-silver-200 pt-5 text-[13.5px]">
              <Row label="Subtotal" value={formatMoney(order.subtotal, "en")} />
              {order.discount > 0 && (
                <Row
                  label={`Discount${order.discount_code ? ` · ${order.discount_code}` : ""}`}
                  value={`− ${formatMoney(order.discount, "en")}`}
                />
              )}
              <Row
                label="Shipping"
                value={order.shipping === 0 ? "Free" : formatMoney(order.shipping, "en")}
              />
              <div className="flex items-baseline justify-between border-t border-silver-200 pt-3">
                <dt className="font-medium">Total</dt>
                <dd className="font-display text-xl tabular-nums">
                  {formatMoney(order.total, "en")}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-silver-200 bg-white p-5 sm:p-6">
            <h2 className="font-display text-[15px] uppercase tracking-tight">History</h2>
            <OrderTimeline order={order} locale="en" />
          </section>
        </div>

        <aside className="space-y-5">
          <OrderStatusControl
            id={order.id}
            status={order.status}
            paymentStatus={order.payment_status}
          />

          <div className="rounded-lg border border-silver-200 bg-white p-5">
            <h3 className="eyebrow">Customer</h3>
            <address className="mt-3 space-y-1 text-[13.5px] not-italic leading-relaxed text-ice-700">
              <p className="font-medium text-ice-900">{order.full_name}</p>
              <p dir="ltr">
                <a href={`tel:${order.phone}`} className="hover:underline">
                  {order.phone}
                </a>
              </p>
              {order.email && (
                <p dir="ltr">
                  <a href={`mailto:${order.email}`} className="hover:underline">
                    {order.email}
                  </a>
                </p>
              )}
              <p className="pt-1">{order.address}</p>
              <p>{order.city}</p>
            </address>
            {order.customer_id && (
              <Link
                href={`/admin/customers`}
                className="mt-3 inline-block text-[12.5px] text-ice-700 underline underline-offset-4"
              >
                Registered account
              </Link>
            )}
          </div>

          <div className="rounded-lg border border-silver-200 bg-white p-5">
            <h3 className="eyebrow">Payment</h3>
            <p className="mt-3 text-[13.5px]">
              {order.payment_method === "cod" ? "Cash on delivery" : "InstaPay"}
            </p>
            {order.payment_proof_url && (
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noreferrer"
                className="group mt-3 block overflow-hidden rounded-md border border-silver-200"
              >
                <div className="relative aspect-4/3 bg-ice-100">
                  <Image
                    src={order.payment_proof_url}
                    alt="Payment proof"
                    fill
                    sizes="320px"
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <span className="block bg-ice-50 px-3 py-2 text-[11.5px] text-ice-600">
                  Transfer screenshot — open full size
                </span>
              </a>
            )}
          </div>

          {order.notes && (
            <div className="rounded-lg border border-silver-200 bg-white p-5">
              <h3 className="eyebrow">Order notes</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ice-700">{order.notes}</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ice-600">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
