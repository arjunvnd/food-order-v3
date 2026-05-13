const PLANS = [
  {
    name: "Starter",
    price: "TBD",
    description: "Perfect for a single-outlet restaurant or café.",
    features: [
      "Up to 20 tables",
      "1 vendor account",
      "Real-time order dashboard",
      "Basic analytics",
      "Email support",
    ],
    highlighted: false,
    cta: "Get in Touch",
  },
  {
    name: "Pro",
    price: "TBD",
    description: "For growing restaurants and small food courts.",
    features: [
      "Up to 100 tables",
      "Up to 10 vendors",
      "Multi-vendor ordering",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
    ],
    highlighted: true,
    cta: "Get in Touch",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large malls and multi-location chains.",
    features: [
      "Unlimited tables",
      "Unlimited vendors",
      "White-label option",
      "SLA guarantee",
      "Dedicated onboarding",
      "API access",
    ],
    highlighted: false,
    cta: "Contact Sales",
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-teal-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-4xl font-bold text-slate-900">
            Simple, transparent pricing
          </h2>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto">
            We&apos;re still finalising our pricing. Reach out to be among the first
            on the platform and lock in early-access rates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? "bg-teal-600 text-white shadow-2xl shadow-teal-200 md:scale-105"
                  : "bg-slate-50 border border-slate-100"
              }`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                  plan.highlighted ? "text-teal-100" : "text-teal-600"
                }`}
              >
                {plan.name}
              </p>
              <p
                className={`text-4xl font-extrabold mb-1 ${
                  plan.highlighted ? "text-white" : "text-slate-900"
                }`}
              >
                {plan.price}
              </p>
              <p
                className={`text-sm mb-6 ${
                  plan.highlighted ? "text-teal-100" : "text-slate-500"
                }`}
              >
                {plan.description}
              </p>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-2 text-sm ${
                      plan.highlighted ? "text-teal-50" : "text-slate-600"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 flex-shrink-0 ${
                        plan.highlighted ? "text-teal-200" : "text-teal-500"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-white text-teal-700 hover:bg-teal-50"
                    : "bg-teal-600 text-white hover:bg-teal-500"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-400 text-sm mt-10">
          Pricing is indicative and subject to change. All plans include a
          30-day free trial.
        </p>
      </div>
    </section>
  );
}
