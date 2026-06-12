import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowDown, Bookmark, Star, Eye, ExternalLink } from "lucide-react";
import { siteConfig } from "@/config/site";
import { generateNarrative, RankedPaddle } from "@/lib/weeklyNarrative";

// Shared presentation for both /weekly (latest) and /weekly/[date] (archive).
// Only the header text differs between the two — everything below is identical.

function getCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

interface Props {
  rankings: RankedPaddle[];
  heading: string;
  subheading: string;
}

export default function WeeklyRankingsView({ rankings, heading, subheading }: Props) {
  const narrative = generateNarrative(rankings);

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="mb-6">
          <Link
            href="/best-pickleball-paddles"
            className="inline-flex items-center gap-1 text-sm font-semibold mb-4 transition-colors hover:text-brand-400"
            style={{ color: "#2dd4bf" }}
          >
            &larr; Best Paddles
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
            Weekly Rankings
          </p>
          <h1
            className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            {heading}
          </h1>
          <p className="text-lg font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
            {subheading}
          </p>
        </div>

        {/* ── Paddle image strip (Google image carousel) ────────────── */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {rankings.map((r) => (
            <Link
              key={r.paddle.slug}
              href={`/paddles/${r.paddle.slug}`}
              className="flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
              style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {r.paddle.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.paddle.image}
                  alt={`#${r.rank} ${r.paddle.brand} ${r.paddle.name}`}
                  className="w-full h-full object-contain p-1.5"
                />
              )}
            </Link>
          ))}
        </div>

        {/* ── Narrative ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {narrative}
          </p>
        </div>

        {/* ── Rankings ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {rankings.map((r) => {
            const hasLink = !!r.paddle.discountLink?.trim();
            const code = getCode(r.paddle.brand, r.paddle.discountLink);
            const noDiscount = !r.paddle.amountOff || r.paddle.amountOff === "$0";
            const priceNum = r.paddle.price ? parseFloat(r.paddle.price.replace(/[^0-9.]/g, "")) : null;

            let movement: React.ReactNode = null;
            if (r.prevRank === null) {
              movement = (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-brand-500/20 text-brand-400">
                  New
                </span>
              );
            } else if (r.prevRank > r.rank) {
              movement = (
                <span className="flex items-center gap-0.5 text-xs font-bold text-green-400">
                  <ArrowUp className="w-3 h-3" /> {r.prevRank - r.rank}
                </span>
              );
            } else if (r.prevRank < r.rank) {
              movement = (
                <span className="flex items-center gap-0.5 text-xs font-bold text-red-400">
                  <ArrowDown className="w-3 h-3" /> {r.rank - r.prevRank}
                </span>
              );
            } else {
              movement = (
                <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>&mdash;</span>
              );
            }

            return (
              <div
                key={r.paddle.slug}
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Rank + image */}
                  <div className="flex items-center gap-4 p-5 sm:w-[35%]">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-extrabold"
                        style={{ background: r.rank === 1 ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.06)", color: r.rank === 1 ? "#2dd4bf" : "var(--text-muted)" }}
                      >
                        {r.rank}
                      </span>
                      {movement}
                    </div>
                    <Link
                      href={`/paddles/${r.paddle.slug}`}
                      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      {r.paddle.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.paddle.image}
                          alt={`${r.paddle.brand} ${r.paddle.name}`}
                          className="w-full h-full object-contain p-1"
                        />
                      )}
                    </Link>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>
                        {r.paddle.brand}
                      </p>
                      <Link href={`/paddles/${r.paddle.slug}`}>
                        <h2 className="text-base font-extrabold leading-tight hover:text-brand-400 transition-colors" style={{ color: "var(--text-primary)" }}>
                          {r.paddle.name}
                        </h2>
                      </Link>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {r.paddle.shape} · {r.paddle.thickness}
                      </p>
                    </div>
                  </div>

                  {/* Specs + engagement + CTA */}
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 pt-0 sm:pt-5">
                    {/* Specs */}
                    <div className="flex flex-wrap gap-1.5">
                      {r.paddle.weight && (
                        <span className="text-[11px] font-bold font-mono px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
                          {r.paddle.weight}
                        </span>
                      )}
                      {r.paddle.swingWeight > 0 && (
                        <span className="text-[11px] font-bold font-mono px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
                          SW {r.paddle.swingWeight}
                        </span>
                      )}
                      {r.paddle.twistWeight > 0 && (
                        <span className="text-[11px] font-bold font-mono px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
                          TW {r.paddle.twistWeight}
                        </span>
                      )}
                    </div>

                    {/* Engagement — readable breakdown (composite stays in the DB, not shown) */}
                    <div className="flex items-center flex-wrap gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <Bookmark className="w-3 h-3 flex-shrink-0" style={{ color: "#2dd4bf" }} fill="currentColor" />
                      <span>
                        {plural(r.hearts, "save")} · {plural(r.ratings, "rating")} · {plural(r.views, "view")} this week
                      </span>
                      {r.ratings > 0 && (
                        <span className="inline-flex items-center gap-0.5 ml-1" style={{ color: "#facc15" }}>
                          <Star className="w-3 h-3" fill="currentColor" strokeWidth={0} /> {r.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center gap-2 sm:ml-auto">
                      {priceNum && (
                        <span className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                          {r.paddle.price}
                        </span>
                      )}
                      {!noDiscount && (
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md" style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}>
                          {code}
                        </span>
                      )}
                      {hasLink && (
                        <a
                          href={r.paddle.discountLink}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:scale-105"
                          style={{ background: "#14b8a6" }}
                        >
                          Buy <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer CTA ────────────────────────────────────────────── */}
        <div className="mt-12 text-center">
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Rankings update every Monday based on community engagement.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/paddles"
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
              style={{ background: "#14b8a6" }}
            >
              Browse All Paddles <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/best-pickleball-paddles"
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-[1.02]"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-primary)" }}
            >
              Editor&apos;s Picks
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
