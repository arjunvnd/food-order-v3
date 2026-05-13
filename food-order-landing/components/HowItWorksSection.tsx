const STEPS = [
  {
    number: "01",
    title: "Scan the QR Code",
    description:
      "Customers scan the QR code at their table with any smartphone. No app required, no sign-up, no fuss.",
  },
  {
    number: "02",
    title: "Browse & Order",
    description:
      "Customers browse the menu, customise items, and place their order in under a minute — right from their seat.",
  },
  {
    number: "03",
    title: "Sit Back & Receive",
    description:
      "The kitchen gets the order instantly. Staff bring the food straight to the table. Zero queuing, zero stress.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-teal-600 font-semibold text-sm uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-4xl font-bold text-slate-900">
            From scan to served in 3 steps
          </h2>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto">
            MallBite is designed to be invisible. Customers just order, vendors
            just serve — technology handles the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connector line visible on desktop */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-teal-200" />

          {STEPS.map((step) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-extrabold mb-6 shadow-lg shadow-teal-200 relative z-10">
                {step.number}
              </div>
              <h3 className="font-bold text-slate-900 text-xl mb-3">
                {step.title}
              </h3>
              <p className="text-slate-500 leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
