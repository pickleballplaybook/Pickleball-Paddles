import { ArrowRight, Mail } from "lucide-react";
import { siteConfig } from "@/config/site";

interface SubstackCardProps {
  variant?: "inline" | "dark" | "banner";
}

export default function SubstackCard({ variant = "inline" }: SubstackCardProps) {
  if (variant === "banner") {
    return (
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-6 md:px-10 md:py-7"
        style={{ background: "#0a64bc" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 w-56 h-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)", transform: "translate(35%, -35%)" }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mail className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-extrabold text-white text-lg leading-snug tracking-tight">
                Get Early Reviews & Paddle Deals First
              </p>
              <p className="text-white/75 text-sm mt-0.5">
                Be the first to see new paddle reviews and get exclusive discounts before anyone else.
              </p>
            </div>
          </div>
          <a
            href={siteConfig.substackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-brand-700 font-bold text-sm px-5 py-3 rounded-xl transition-all duration-200 hover:bg-brand-50 active:scale-[0.98] shadow-sm whitespace-nowrap"
          >
            Join Free
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    );
  }

  if (variant === "dark") {
    return (
      <div className="border border-white/10 rounded-2xl px-5 py-5 bg-white/5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-brand-500/20 border border-brand-400/25 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Mail className="w-4 h-4 text-brand-400" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-snug">
              Get Early Reviews & Paddle Deals First
            </p>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
              Be the first to see new paddle reviews and get exclusive discounts before anyone else.
            </p>
          </div>
        </div>
        <a
          href={siteConfig.substackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-200"
        >
          Join Free
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Mail className="w-4 h-4 text-brand-500" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm leading-snug">
              Get Early Reviews & Paddle Deals First
            </p>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
              Be the first to see new paddle reviews and get exclusive discounts before anyone else.
            </p>
          </div>
        </div>
        <a
          href={siteConfig.substackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shadow-sm"
        >
          Join Free
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        </a>
      </div>
    </div>
  );
}
