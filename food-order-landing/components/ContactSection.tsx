"use client";

import { useState } from "react";

type FormState = "idle" | "sending" | "success" | "error";

const inputClass =
  "w-full bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition";

export default function ContactSection() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)
        .value,
      _gotcha: (form.elements.namedItem("_gotcha") as HTMLInputElement).value,
    };

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setState("success");
        form.reset();
      } else if (res.status === 429) {
        setState("error");
        setErrorMsg(
          "Too many requests from your connection. Please try again in 15 minutes.",
        );
      } else {
        const body = await res.json().catch(() => ({}));
        setState("error");
        setErrorMsg(
          (body as { error?: string }).error ??
            "Something went wrong. Please try again.",
        );
      }
    } catch {
      setState("error");
      setErrorMsg("Network error. Please check your connection and try again.");
    }
  }

  return (
    <section id="contact" className="py-24 bg-slate-900">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-3">
            Get in Touch
          </p>
          <h2 className="text-4xl font-bold text-white">
            Interested in MallBite?
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">
            Tell us about your food court, mall, or restaurant and we&apos;ll get
            back to you within 24 hours.
          </p>
        </div>

        {state === "success" ? (
          <div className="bg-teal-900/50 border border-teal-600 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Thanks! We&apos;ll be in touch.
            </h3>
            <p className="text-teal-200">
              We&apos;ve received your inquiry and will reply within 24 hours.
            </p>
            <button
              onClick={() => setState("idle")}
              className="mt-6 text-teal-400 hover:text-teal-300 underline text-sm transition-colors"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-slate-800 rounded-2xl p-8 space-y-6"
          >
            {/* Honeypot — hidden from real users, bots fill it in */}
            <input
              type="text"
              name="_gotcha"
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Name <span className="text-teal-400">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Email <span className="text-teal-400">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={150}
                  placeholder="you@company.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Mall / Restaurant name{" "}
                <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="company"
                name="company"
                type="text"
                maxLength={150}
                placeholder="e.g. City Square Mall"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Message <span className="text-teal-400">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                maxLength={2000}
                rows={5}
                placeholder="Tell us about your setup and what you're looking for..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {state === "error" && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={state === "sending"}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors text-lg"
            >
              {state === "sending" ? "Sending…" : "Send Inquiry"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
