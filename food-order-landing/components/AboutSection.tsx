const STATS = [
  { label: "Food courts served", value: "Coming soon" },
  { label: "Orders processed", value: "Launching 2026" },
  { label: "Average wait reduction", value: "40%" },
  { label: "Built for", value: "You" },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-teal-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-teal-200 font-semibold text-sm uppercase tracking-widest mb-3">
              About MallBite
            </p>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              We believe dining out shouldn&apos;t mean waiting in line.
            </h2>
            <p className="text-teal-100 leading-relaxed mb-6">
              MallBite was built for one reason: the food court experience is
              broken. Customers waste 15–20 minutes queuing, lose their seat,
              and forget what they ordered. Vendors serve a fraction of the
              customers they could.
            </p>
            <p className="text-teal-100 leading-relaxed">
              We built a QR-code-first ordering platform that connects
              customers, vendors, and mall operators in real time — so everyone
              wins. Less waiting. More orders. Happier guests.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {STATS.map((item) => (
              <div
                key={item.label}
                className="bg-teal-600/50 rounded-2xl p-6 border border-teal-500/30"
              >
                <p className="text-2xl font-bold text-white mb-1">
                  {item.value}
                </p>
                <p className="text-teal-200 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
