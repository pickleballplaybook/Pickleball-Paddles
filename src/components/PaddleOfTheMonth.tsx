import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Award, ExternalLink, Tag } from "lucide-react";
import { Paddle } from "@/types";
import PerformanceBar from "./PerformanceBar";

interface PaddleOfTheMonthProps {
  paddle: Paddle;
}

export default function PaddleOfTheMonth({ paddle }: PaddleOfTheMonthProps) {
  const hasLink = !!paddle.discountLink?.trim();
  const code = (paddle.brand === "Selkirk" || paddle.brand === "SLK") && !paddle.discountLink?.includes("lockerroompickleball.com") ? "INF-PLAYBOOK" : "PLAYBOOK";

  return (
    <section className="section-y bg-slate-900 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-brand-500/5 rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container-xl relative z-10">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Award className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">
              Featured Selection
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Paddle of the Month
            </h2>
          </div>
        </div>

        {/* Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex items-center justify-center">
              {paddle.image ? (
                <Image
                  src={paddle.image}
                  alt={paddle.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-10"
                />
              ) : (
                <svg viewBox="0 0 120 160" fill="none" className="w-36 h-auto opacity-20" aria-hidden="true">
                  <rect x="5" y="5" width="110" height="115" rx="55" fill="#14b8a6" />
                  <rect x="45" y="116" width="30" height="40" rx="15" fill="#0d9488" />
                </svg>
              )}
            </div>
            {/* Glow */}
            <div className="absolute inset-0 rounded-3xl bg-brand-500/10 blur-3xl -z-10 scale-110" />
          </div>

          {/* Content */}
          <div>
            <p className="text-sm font-bold text-brand-400 uppercase tracking-widest mb-2">
              {paddle.brand}
            </p>
            <h3 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-1">
              {paddle.name}
            </h3>
            <p className="text-slate-400 text-base mb-3">
              {paddle.shape} · {paddle.thickness} core · {paddle.weight}
            </p>
            {paddle.tagline && (
              <p className="text-slate-300 text-lg mb-2">{paddle.tagline}</p>
            )}
            {paddle.description && (
              <p className="text-slate-400 text-sm leading-relaxed mb-8">{paddle.description}</p>
            )}

            {/* Performance bars — only if ratings exist */}
            {paddle.ratings && (
              <div className="space-y-5 mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
                <PerformanceBar label="Power"   value={paddle.ratings.power}   />
                <PerformanceBar label="Spin"    value={paddle.ratings.spin}    />
                <PerformanceBar label="Control" value={paddle.ratings.control} />
              </div>
            )}

            {/* Code badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs text-brand-400 font-semibold bg-brand-400/10 border border-brand-400/20 px-3 py-1.5 rounded-lg font-mono tracking-widest uppercase">
                <Tag className="w-3 h-3" />
                Code {code}
              </div>
              {paddle.price && (
                <span className="text-2xl font-extrabold text-white">{paddle.price}</span>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link href={`/paddles/${paddle.slug}`} className="btn-brand px-6 py-3">
                View Full Details
                <ArrowRight className="w-4 h-4" />
              </Link>
              {hasLink && (
                <a
                  href={paddle.discountLink}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-6 py-3 rounded-xl transition-all"
                >
                  Get Discount
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
