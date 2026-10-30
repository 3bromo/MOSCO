export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="prose max-w-none text-ice-700">
        <h2 className="font-display text-2xl uppercase tracking-tight text-ice-900 mb-6">Orders</h2>
        <p>You haven't placed an order yet.</p>
        <ul className="list-disc pl-6 space-y-4">
          <li>No orders found</li>
        </ul>
      </div>
    </div>
  );
}
