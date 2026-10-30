import { ShieldCheck, Users } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  const repo = db();
  const [customers, orders] = await Promise.all([repo.listCustomers(), repo.listOrders()]);

  const rows = customers
    .map((c) => {
      const theirs = orders.filter((o) => o.customer_id === c.id && o.status !== "cancelled");
      return {
        id: c.id,
        name: c.full_name,
        email: c.email,
        phone: c.phone,
        role: c.role,
        created_at: c.created_at,
        orderCount: theirs.length,
        spent: theirs.reduce((n, o) => n + o.total, 0),
        wishlist: c.wishlist.length,
        addresses: c.addresses.length,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  return (
    <>
      <AdminHeader
        title="Customers"
        subtitle="Registered accounts. Guest checkouts appear under Orders only — we never create an account without consent."
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-silver-300 p-12 text-center">
          <Users className="mx-auto h-7 w-7 text-ice-400" strokeWidth={1.25} />
          <p className="mt-3 text-[13.5px] text-ice-600">No registered customers yet.</p>
        </div>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
          <table className="w-full min-w-[720px] border-collapse overflow-hidden rounded-lg bg-white text-[13px] ring-1 ring-silver-200">
            <thead>
              <tr className="border-b border-silver-200 bg-ice-50/60">
                <Th>Customer</Th>
                <Th>Contact</Th>
                <Th className="text-end">Orders</Th>
                <Th className="text-end">Spent</Th>
                <Th className="text-end">Wishlist</Th>
                <Th className="text-end">Joined</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver-200">
              {rows.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-ice-50/50">
                  <td className="px-4 py-3.5">
                    <p className="flex items-center gap-2 font-medium">
                      {r.name}
                      {r.role === "admin" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ice-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-white">
                          <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2} />
                          admin
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-ice-500">
                      {r.addresses} saved address{r.addresses === 1 ? "" : "es"}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p dir="ltr" className="text-ice-700">
                      {r.email}
                    </p>
                    <p dir="ltr" className="mt-0.5 text-[11.5px] text-ice-500">
                      {r.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-end tabular-nums">{r.orderCount}</td>
                  <td className="px-4 py-3.5 text-end font-medium tabular-nums">
                    {formatMoney(r.spent, "en")}
                  </td>
                  <td className="px-4 py-3.5 text-end tabular-nums text-ice-600">{r.wishlist}</td>
                  <td className="px-4 py-3.5 text-end text-[12px] text-ice-500">
                    {new Date(r.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-start text-[11px] font-medium uppercase tracking-[0.08em] text-ice-500 ${className ?? ""}`}
    >
      {children}
    </th>
  );
}
