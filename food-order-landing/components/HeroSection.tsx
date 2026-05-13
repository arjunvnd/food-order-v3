export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen bg-slate-900 flex items-center justify-center overflow-hidden"
    >
      {/* Decorative radial gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,_rgba(13,148,136,0.25)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,_rgba(245,158,11,0.12)_0%,_transparent_60%)]" />

      <div className="relative max-w-5xl mx-auto px-6 text-center py-40">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-teal-900/60 border border-teal-700/50 text-teal-300 px-4 py-1.5 rounded-full text-sm font-medium mb-10">
          <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
          Serving food courts &amp; malls — now open for early access
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
          Beat the Queue.
          <span className="block text-teal-400 mt-2">Serve Smarter.</span>
        </h1>

        {/* Subtext */}
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          MallBite lets customers order at their table via QR code — no waiting
          in line, no friction. Restaurants get real-time order management. Malls
          keep guests happy and spending more.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#contact"
            className="bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-teal-900/50"
          >
            Request a Demo
          </a>
          <a
            href="#how-it-works"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            See How It Works
          </a>
        </div>

        {/* Stats */}
        <div className="mt-24 grid grid-cols-3 gap-8 max-w-md mx-auto">
          {[
            { value: "3×", label: "Faster ordering" },
            { value: "40%", label: "Less wait time" },
            { value: "Zero", label: "Line frustration" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-teal-400">{stat.value}</p>
              <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade into the next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-white pointer-events-none" />
    </section>
  );
}
