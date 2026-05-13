const FOOTER_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-teal-400 font-extrabold text-xl tracking-tight">
              MallBite
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Beat the queue. Serve smarter.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap gap-6 justify-center">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} MallBite. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
