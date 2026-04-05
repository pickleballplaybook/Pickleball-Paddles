"use client";

import { Mail, MessageCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-28" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-20 md:py-28">
        <div className="max-w-xl">
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4">
            Get in Touch
          </p>
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Contact Us
          </h1>
          <p className="text-slate-400 text-lg mb-12">
            Have a question about a paddle, a discount code issue, or want to
            suggest a paddle we should review? We&apos;d love to hear from you.
          </p>

          <div className="space-y-4 mb-12">
            <a
              href="mailto:hello@playbookpickleball.com"
              className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group"
            >
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-0.5">
                  Email
                </p>
                <p className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  hello@playbookpickleball.com
                </p>
              </div>
            </a>
            <div className="card p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-0.5">
                  Response Time
                </p>
                <p className="text-sm font-bold text-slate-900">
                  Usually within 24 hours
                </p>
              </div>
            </div>
          </div>

          {/* Simple contact form */}
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                placeholder="John Smith"
                className="w-full text-sm text-slate-800 placeholder:text-slate-300 bg-white border border-slate-200 rounded-xl px-4 py-3
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className="w-full text-sm text-slate-800 placeholder:text-slate-300 bg-white border border-slate-200 rounded-xl px-4 py-3
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Message
              </label>
              <textarea
                rows={5}
                placeholder="Tell us how we can help..."
                className="w-full text-sm text-slate-800 placeholder:text-slate-300 bg-white border border-slate-200 rounded-xl px-4 py-3
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow resize-none"
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3.5">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
