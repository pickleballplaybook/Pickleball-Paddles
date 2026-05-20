import Link from "next/link";
import { ArrowRight, ExternalLink, CheckCircle2 } from "lucide-react";
import { getPaddleBySlug } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import { getPaddleCountLabel } from "@/lib/catalogStats";
import type { Paddle } from "@/types";

function getCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

interface CategoryPick {
  slug: string;         // primary paddle slug
  seriesSlugs?: string[]; // if it's a series, show all shapes
  why: string;
}

interface CategoryPageProps {
  category: string;        // e.g. "Spin"
  accent: string;          // e.g. "#f97316"
  headline: string;        // e.g. "Best Spin Paddles of 2026"
  intro: string;           // introductory paragraph
  picks: CategoryPick[];
}

export default function CategoryPage({ category, accent, headline, intro, picks }: CategoryPageProps) {
  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-16">

        {/* Breadcrumbs */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <li>
              <Link href="/best-pickleball-paddles" className="transition-colors hover:text-brand-400" style={{ color: "var(--text-muted)" }}>
                Best Paddles
              </Link>
            </li>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <li style={{ color: "var(--text-primary)" }}>{category}</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="mb-12 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>
            Editor&apos;s Picks &middot; Updated May 2026
          </p>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            {headline}
          </h1>
          <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
            {intro}
          </p>
          <div className="flex flex-wrap gap-4">
            {[`${getPaddleCountLabel()} Paddles Tested`, "Unsponsored Reviews", "Lab-Measured Specs"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
                <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Picks */}
        <div className="flex flex-col gap-10">
          {picks.map((pick, i) => {
            const paddle = getPaddleBySlug(pick.slug);
            if (!paddle) return null;
            const seriesPaddles = pick.seriesSlugs
              ? pick.seriesSlugs.map(getPaddleBySlug).filter(Boolean) as Paddle[]
              : null;
            const priceNum = paddle.price ? parseFloat(paddle.price.replace(/[^0-9.]/g, "")) : null;
            const code = getCode(paddle.brand, paddle.discountLink);
            const noDiscount = !paddle.amountOff || paddle.amountOff === "$0";

            return (
              <div key={pick.slug}>
                {/* Rank label */}
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                    style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}50` }}
                  >
                    #{i + 1} Pick
                  </span>
                  <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                </div>

                {/* Card */}
                <div
                  className="rounded-3xl overflow-hidden"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: i === 0 ? "0 16px 48px rgba(0,0,0,0.3)" : undefined,
                  }}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div
                      className="md:w-[38%] flex-shrink-0 flex items-center justify-center p-10"
                      style={{ background: "var(--bg-alt)", minHeight: "260px" }}
                    >
                      {seriesPaddles && seriesPaddles.length > 1 ? (
                        <div className="flex items-end" style={{ perspective: "800px" }}>
                          {seriesPaddles.map((sp, si) => {
                            const translateY = si === 1 ? -12 : 0;
                            const rotate = si === 0 ? 5 : si === seriesPaddles.length - 1 ? -5 : 0;
                            return (
                              <Link
                                key={sp.slug}
                                href={`/paddles/${sp.slug}`}
                                className="relative transition-transform duration-300 hover:scale-105 hover:z-10"
                                style={{
                                  transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
                                  marginLeft: si > 0 ? "-16px" : "0",
                                  zIndex: si === 1 ? 3 : 1,
                                }}
                              >
                                <div className="flex flex-col items-center" style={{ width: "100px" }}>
                                  {sp.image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={sp.image}
                                      alt={`${sp.brand} ${sp.name}`}
                                      className="w-full h-auto object-contain"
                                      style={{ maxHeight: "160px", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))" }}
                                    />
                                  )}
                                  <p className="text-[10px] font-bold text-center mt-1 truncate w-full" style={{ color: "rgba(255,255,255,0.6)" }}>
                                    {sp.shape}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={paddle.image ?? ""}
                          alt={`${paddle.brand} ${paddle.name} ${paddle.shape} ${paddle.thickness} pickleball paddle`}
                          className="w-full h-full object-contain"
                          style={{ maxHeight: "200px", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {paddle.brand}
                      </p>
                      <h2 className="text-2xl font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
                        {seriesPaddles ? `${paddle.brand} ${paddle.name.split(" ").slice(0, -1).join(" ") || paddle.name}` : paddle.name}
                      </h2>
                      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>
                        {seriesPaddles
                          ? `${seriesPaddles.map((sp) => sp.shape).join(", ")} · ${paddle.thickness}`
                          : `${paddle.shape} · ${paddle.thickness}`}
                        {priceNum ? ` · $${priceNum.toFixed(2)}` : ""}
                        {!noDiscount ? ` (${paddle.amountOff} off)` : ""}
                      </p>
                      <p
                        className="text-base leading-relaxed mb-6"
                        style={{ color: "var(--text-muted)", maxWidth: "52ch" }}
                      >
                        {pick.why}
                      </p>

                      {/* Spec pills */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {[
                          paddle.swingWeight ? `SW ${paddle.swingWeight}` : null,
                          paddle.twistWeight ? `TW ${paddle.twistWeight}` : null,
                          paddle.weight || null,
                        ].filter(Boolean).map((s) => (
                          <span
                            key={s}
                            className="text-xs font-bold px-3 py-1.5 rounded-full font-mono"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "rgba(255,255,255,0.55)",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={seriesPaddles && paddle.seriesSlug ? `/series/${paddle.seriesSlug}` : `/paddles/${pick.slug}`}
                          className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all duration-200 hover:scale-[1.02]"
                          style={{ background: accent }}
                        >
                          {seriesPaddles ? "View Series" : "Full Review"}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        {paddle.discountLink && (
                          <a
                            href={paddle.discountLink}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                            style={{ border: `1.5px solid ${accent}66`, color: accent }}
                          >
                            {noDiscount ? "Buy Now" : `Get Discount · ${code}`}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-center text-center gap-5">
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            Want to see all categories?
          </p>
          <Link
            href="/best-pickleball-paddles"
            className="inline-flex items-center gap-2 font-bold text-base px-10 py-4 rounded-2xl text-white transition-all duration-200 hover:scale-[1.02]"
            style={{ background: accent }}
          >
            All Best Paddles <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
