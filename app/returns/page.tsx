export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-2xl uppercase tracking-tight text-ice-900 mb-6">Returns & Exchanges</h2>
        <div className="prose max-w-none text-ice-700">
          <p>You can return unworn items within 14 days of delivery for a full refund or exchange.</p>
          <ul>
            <li>Items must be in their original condition with tags attached.</li>
            <li>Sale items are final sale.</li>
            <li>Return shipping costs are the customer's responsibility.</li>
          </ul>
          <p>To start a return, please contact us at <a href="/contact" className="text-ice-800 hover underline">contact@moscow.store</a>.</p>
        </div>
      </div>
    </div>
  );
}
