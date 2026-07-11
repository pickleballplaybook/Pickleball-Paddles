import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, Flame } from "lucide-react";
import { Paddle } from "@/types";

interface WhatsTrendingProps {
  paddles: Paddle[];
}

/** trendingScore → heat label */
function heatLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "🔥 On Fire", color: "text-red-500 bg-red-50 border-red-200" };
  if (score >= 75) return { label: "↑ Hot", color: "text-orange-600 bg-orange-50 border-orange-200" };
  if (score >= 60) return { label: "↑ Rising", color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: "Trending", color: "text-brand-600 bg-brand-50 border-brand-200" };
}

export default function WhatsTrending({ paddles }: WhatsTrendingProps) {
  if (!paddles.length) return null;

  const [top, ...rest] = paddles;
  const topHeat = heatLabel(top.trendingScore);

  return (
    <section className="section-y bg-slate-50">
      <div className="container-xl">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <p className="text-xs font-bold text-brand-500 uppercase tracking-widest">
                Most Viewed This Week
              </p>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              What&apos;s Trending
            </h2>
          </div>
          <Link href="/paddles" className="btn-secondary text-sm hidden sm:inline-flex">
            All Paddles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Hero trending paddle */}
          <Link
            href={`/paddles/${top.slug}`}
            className="lg:col-span-2 card group p-6 flex flex-col"
          >
            <div className="relative aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-5 flex items-center justify-center">
              {top.image ? (
                <Image
                  src={top.image}
                  alt={top.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <svg viewBox="0 0 120 160" fill="none" className="w-20 h-auto opacity-15" aria-hidden="true">
                  <rect x="5" y="5" width="110" height="115" rx="55" fill="#60a5fa" />
                  <rect x="45" y="116" width="30" height="40" rx="15" fill="#11295f" />
                </svg>
              )}
              <div className="absolute top-3 left-3">
                <span className={`badge border text-xs px-2.5 py-1 font-semibold ${topHeat.color}`}>
                  <Flame className="w-3 h-3 inline mr-1" />
                  {topHeat.label.replace(/^[^\w]+ ?/, "")}
                </span>
              </div>
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-lg px-2 py-1">
                <span className="text-xs font-bold text-slate-700">#1</span>
              </div>
            </div>
            <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">
              {top.brand}
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 leading-tight mb-2 group-hover:text-brand-600 transition-colors">
              {top.name}
            </h3>
            <p className="text-sm text-slate-400 line-clamp-2 flex-1 mb-4">
              {top.tagline}
            </p>
            <div className="flex items-center justify-between">
              {top.price && <span className="text-xl font-extrabold text-slate-900">{top.price}</span>}
              <span className="text-sm text-brand-600 font-semibold flex items-center gap-1">
                View Details <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Secondary trending paddles */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {rest.map((paddle, i) => {
              const heat = heatLabel(paddle.trendingScore);
              return (
                <Link
                  key={paddle.id}
                  href={`/paddles/${paddle.slug}`}
                  className="card group p-4 flex items-center gap-4"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-extrabold text-slate-400">
                      #{i + 2}
                    </span>
                  </div>
                  <div className="relative w-16 h-16 flex-shrink-0 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center">
                    {paddle.image ? (
                      <Image
                        src={paddle.image}
                        alt={paddle.name}
                        fill
                        sizes="64px"
                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <svg viewBox="0 0 120 160" fill="none" className="w-8 h-auto opacity-20" aria-hidden="true">
                        <rect x="5" y="5" width="110" height="115" rx="55" fill="#60a5fa" />
                        <rect x="45" y="116" width="30" height="40" rx="15" fill="#11295f" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-brand-500 uppercase tracking-wide mb-0.5">
                      {paddle.brand}
                    </p>
                    <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                      {paddle.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {paddle.price && (
                        <span className="text-sm font-bold text-slate-700">{paddle.price}</span>
                      )}
                      <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${heat.color}`}>
                        {heat.label}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 flex-shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
