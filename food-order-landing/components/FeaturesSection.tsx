const FEATURES = [
  {
    icon: "📱",
    title: "QR-Code Ordering",
    description:
      "Customers scan a table QR code and order directly from their phone. No app download, no sign-up required.",
  },
  {
    icon: "⚡",
    title: "Real-Time Dashboard",
    description:
      "Vendors get live order notifications, manage queue status, and update their menu on the fly.",
  },
  {
    icon: "🏪",
    title: "Multi-Vendor Food Courts",
    description:
      "Customers can browse and order from multiple vendors in a single session — perfect for malls.",
  },
  {
    icon: "📊",
    title: "Analytics & Insights",
    description:
      "Mall admins see occupancy, order trends, and peak-hour data to optimise operations and revenue.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-teal-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-4xl font-bold text-slate-900">
            Everything you need to run a smarter food court
          </h2>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto">
            One platform for customers, vendors, and mall operators — all
            working together in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-50 transition-all duration-200"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
