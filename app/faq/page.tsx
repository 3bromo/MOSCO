export default function FaqPage() {
  return (
    <div className="min-h-screen bg-ice-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-2xl uppercase tracking-tight text-ice-900 mb-6">FAQ</h2>
        <div className="space-y-4">
          <div className="border-b border-silver-200 pb-4">
            <h3 className="font-medium text-ice-900 cursor-pointer hover:text-ice-600 transition-colors">
              How do I track my order?
            </h3>
            <p className="text-[14px] text-ice-600 mt-2">
              Enter your order number and phone number on the tracking page.
            </p>
          </div>
          <div className="border-b border-silver-200 pb-4">
            <h3 className="font-medium text-ice-900 cursor-pointer hover:text-ice-600 transition-colors">
              What is your return policy?
            </h3>
            <p className="text-[14px] text-ice-600 mt-2">
              You can return unworn items within 14 days of delivery.
            </p>
          </div>
          <div className="border-b border-silver-200 pb-4">
            <h3 className="font-medium text-ice-900 cursor-pointer hover:text-ice-600 transition-colors">
              Do you ship internationally?
            </h3>
            <p className="text-[14px] text-ice-600 mt-2">
              We ship within Egypt. International inquiries please contact us.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
