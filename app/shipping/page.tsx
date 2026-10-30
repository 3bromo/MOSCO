export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-2xl uppercase tracking-tight text-ice-900 mb-6">Shipping Information</h2>
        <div className="prose max-w-none text-ice-700">
          <p>Shipping inside Egypt starts at {settings.shipping_flat} EGP and is free over {settings.free_shipping_threshold} EGP.</p>
          <p>Delivery usually takes 2-5 working days.</p>
          <p>Exchanges and returns are accepted within 14 days of delivery while the piece is in its original condition.</p>
        </div>
      </div>
    </div>
  );
}
