import AdminHeader from "@/components/admin/AdminHeader";
import DiscountManager from "@/components/admin/DiscountManager";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDiscounts() {
  const discounts = await db().listDiscounts();

  return (
    <>
      <AdminHeader
        title="Discounts"
        subtitle="Promo codes customers can apply in the cart. Validation happens server-side at checkout, so a tampered code can never be honoured."
      />
      <DiscountManager initial={discounts} />
    </>
  );
}
