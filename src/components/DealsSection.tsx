import Link from "next/link";
import { Tag, ExternalLink } from "lucide-react";
import { paddles } from "@/data/paddles";
import { siteConfig } from "@/config/site";

/**
 * DealsSection — shows a clean list of paddles with the PLAYBOOK discount code.
 * Deliberately un-spammy: one code per paddle, tasteful layout.
 */
export default function DealsSection() {
  const dealPaddles = paddles.slice(0, 6);

  return (
    <section id="deals" className="section-y bg-white">
      <div className="container-xl">

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
              Exclusive Deals
            </p>
            <h2
              className="text-4xl md:text-5xl font-extrabold tracking-tight"
              style={{ color: "#163a6a" }}
            >
              Save on Every Paddle
            </h2>
            <p className="text-slate-400 mt-2 text-lg max-w-xl">
              Use code{" "}
              <span className="font-mono font-bold text-slate-700">{siteConfig.discountCode}</span>
              {" "}at checkout — one code works across all paddles below.
            </p>
          </div>
        </div>

        {/* Deals list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealPaddles.map((paddle) => (
            <div
              key={paddle.id}
              className="flex items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-0.5">
                  {paddle.brand}
                </p>
                <p className="font-bold text-slate-900 text-sm leading-snug truncate">
                  {paddle.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Tag className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-xs font-mono font-semibold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded tracking-widest">
                    {siteConfig.discountCode}
                  </span>
                </div>
              </div>

              <a
                href={paddle.discountLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border-2 transition-all duration-150 active:scale-[0.97] whitespace-nowrap hover:bg-brand-50 ${!paddle.discountLink ? "opacity-40 pointer-events-none" : ""}`}
                style={{ borderColor: "#14b8a6", color: "#0d9488" }}
              >
                View Deal
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
              </a>
            </div>
          ))}
        </div>

        {/* Browse all paddles link */}
        <div className="mt-8 text-center">
          <Link
            href="/paddles"
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Browse all {paddles.length} paddles →
          </Link>
        </div>
      </div>
    </section>
  );
}
