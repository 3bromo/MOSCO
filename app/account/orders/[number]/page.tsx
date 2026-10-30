export default function OrderPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="prose max-w-none text-ice-700">
        <h2 className="font-display text-2xl uppercase tracking-tight text-ice-900 mb-6">
          Order #MW-25-000001
        </h2>
        <div className="border-b border-silver-200 pb-6">
          <div className="flex justify-between items-start">
            <span className="text-ice-500">Status</span>
            <span className="text-ice-900">Processing</span>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-ice-600">Your order is being prepared and packed.</p>
          <p className="mt-4 text-ice-500">Estimated delivery: 2-5 working days</p>
        </div>
      </div>
    </div>
  );
}
