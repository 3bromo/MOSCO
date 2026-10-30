"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from "@/lib/db/types";
import { translate } from "@/lib/i18n/dictionaries";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "proof_submitted", "paid", "refunded"];

export default function OrderStatusControl({
  id,
  status,
  paymentStatus,
}: {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  const router = useRouter();
  const toast = useUI((s) => s.toast);

  const [next, setNext] = useState<OrderStatus>(status);
  const [pay, setPay] = useState<PaymentStatus>(paymentStatus);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const dirty = next !== status || pay !== paymentStatus;

  const apply = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status: next, payment_status: pay, note }),
      });
      if (!res.ok) throw new Error();
      toast("Order updated.", "success");
      setNote("");
      router.refresh();
    } catch {
      toast("Could not update the order.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-silver-200 bg-white p-5">
      <h3 className="eyebrow">Fulfilment</h3>

      <div className="mt-4">
        <label className="label" htmlFor="o_status">
          Order status
        </label>
        <select
          id="o_status"
          value={next}
          onChange={(e) => setNext(e.target.value as OrderStatus)}
          className="field cursor-pointer"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {translate("en", `status.${s}`)}
            </option>
          ))}
        </select>
        {next === "cancelled" && status !== "cancelled" && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
            Cancelling returns these units to stock.
          </p>
        )}
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="p_status">
          Payment status
        </label>
        <select
          id="p_status"
          value={pay}
          onChange={(e) => setPay(e.target.value as PaymentStatus)}
          className="field cursor-pointer"
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="o_note">
          Note for the history (optional)
        </label>
        <input
          id="o_note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Transfer verified"
          className="field"
        />
      </div>

      <button
        type="button"
        onClick={apply}
        disabled={busy || !dirty}
        className={cn("btn btn-primary mt-5 w-full", !dirty && "opacity-50")}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <Check className="h-4 w-4" strokeWidth={2} />
        )}
        Update order
      </button>
    </div>
  );
}
