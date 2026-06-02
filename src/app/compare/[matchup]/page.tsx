import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, Check, Trophy, Minus } from "lucide-react";
import { getPaddleBySlug } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import { effectivePrice } from "@/lib/price";
import type { Paddle } from "@/types";
import InlineNewsletterCTA from "@/components/InlineNewsletterCTA";
import { parseMatchup, canonicalMatchup, buildStaticMatchups } from "./helpers";

export const revalidate = 86400;     // daily ISR
export const dynamicParams = true;   // allow any valid matchup beyond the prebuilt set

interface Props {
  params: { matchup: string };
}

export async function generateStaticParams() {
  return buildStaticMatchups().map((matchup) => ({ matchup }));
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

function fmtPrice(p: Paddle): string | null {
  if (!p.price) return null;
  const eff = effectivePrice(p);
  if (eff === Infinity) return p.price;
  const retail = parseFloat(p.price.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(retail) || eff >= retail) return p.price;
  return `$${eff.toFixed(2)} (was ${p.price})`;
}

interface Winner { which: "a" | "b" | "tie"; reason: string }

function winnerByHigher(label: string, aVal: number, bVal: number, unit = ""): Winner | null {
  if (!aVal && !bVal) return null;
  if (aVal === bVal) return { which: "tie", reason: `Equal ${label} (${aVal}${unit})` };
  const which = aVal > bVal ? "a" : "b";
  const diff = Math.abs(aVal - bVal).toFixed(2);
  return { which, reason: `Higher ${label} (${aVal}${unit} vs ${bVal}${unit}, +${diff})` };
}

function winnerByLower(label: string, aVal: number, bVal: number, unit = ""): Winner | null {
  if (!aVal && !bVal) return null;
  if (aVal === bVal) return { which: "tie", reason: `Equal ${label} (${aVal}${unit})` };
  const which = aVal < bVal ? "a" : "b";
  return { which, reason: `Lower ${label} (${aVal}${unit} vs ${bVal}${unit})` };
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = parseMatchup(params.matchup);
  if (!parsed) return {};
  const a = getPaddleBySlug(parsed[0]);
  const b = getPaddleBySlug(parsed[1]);
  if (!a || !b) return {};

  const canonical = `${siteConfig.siteUrl}/compare/${canonicalMatchup(parsed[0], parsed[1])}`;
  const title = `${a.brand} ${a.name} vs ${b.brand} ${b.name}: Pickleball Paddle Comparison`;
  const description =
    `Side-by-side spec comparison of the ${a.brand} ${a.name} (SW ${a.swingWeight}, TW ${a.twistWeight})` +
    ` and ${b.brand} ${b.name} (SW ${b.swingWeight}, TW ${b.twistWeight}). Which paddle wins for power,` +
    ` control, and value — plus who should buy each.`;

  const images = [a.image, b.image].filter(Boolean).map((src) => ({ url: `${siteConfig.siteUrl}${src}` }));

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: siteConfig.name,
      ...(images.length > 0 ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${a.brand} ${a.name} vs ${b.brand} ${b.name}`,
      description,
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CompareMatchupPage({ params }: Props) {
  const parsed = parseMatchup(params.matchup);
  if (!parsed) notFound();

  const a = getPaddleBySlug(parsed[0]);
  const b = getPaddleBySlug(parsed[1]);
  if (!a || !b || a.slug === b.slug) notFound();

  const aPrice = a.price ? parseFloat(a.price.replace(/[^0-9.]/g, "")) : null;
  const bPrice = b.price ? parseFloat(b.price.replace(/[^0-9.]/g, "")) : null;
  const aEff = effectivePrice(a);
  const bEff = effectivePrice(b);

  // Programmatic verdicts on each comparable attribute.
  const verdicts: Array<{ label: string; result: Winner } > = [];
  const swPower = winnerByHigher("Swing Weight (power)", a.swingWeight, b.swingWeight);
  if (swPower) verdicts.push({ label: "Power", result: swPower });
  const swSpeed = winnerByLower("Swing Weight (hand speed)", a.swingWeight, b.swingWeight);
  if (swSpeed) verdicts.push({ label: "Hand Speed", result: swSpeed });
  const tw = winnerByHigher("Twist Weight (forgiveness)", a.twistWeight, b.twistWeight);
  if (tw) verdicts.push({ label: "Sweet Spot / Forgiveness", result: tw });
  if (aEff !== Infinity && bEff !== Infinity && aEff !== bEff) {
    verdicts.push({
      label: "Value",
      result: {
        which: aEff < bEff ? "a" : "b",
        reason: `Lower effective price ($${aEff.toFixed(2)} vs $${bEff.toFixed(2)}, with PLAYBOOK)`,
      },
    });
  }

  const canonical = `${siteConfig.siteUrl}/compare/${canonicalMatchup(parsed[0], parsed[1])}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteConfig.siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Compare", "item": `${siteConfig.siteUrl}/compare` },
      { "@type": "ListItem", "position": 3, "name": `${a.brand} ${a.name} vs ${b.brand} ${b.name}`, "item": canonical },
    ],
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${a.brand} ${a.name} vs ${b.brand} ${b.name}: Pickleball Paddle Comparison`,
    "datePublished": "2026-06-01",
    "dateModified": new Date().toISOString().slice(0, 10),
    "author": { "@type": "Person", "name": "Austin Hardy", "url": siteConfig.siteUrl },
    "publisher": {
      "@type": "Organization",
      "name": "Pickleball Playbook",
      "url": siteConfig.siteUrl,
      "logo": { "@type": "ImageObject", "url": `${siteConfig.siteUrl}/images/Logo.svg` },
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
    "image": [a.image, b.image].filter(Boolean).map((src) => `${siteConfig.siteUrl}${src}`),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl py-12">

          {/* Breadcrumbs */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <li><Link href="/" className="transition-colors hover:text-brand-400" style={{ color: "var(--text-muted)" }}>Home</Link></li>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <li><Link href="/compare" className="transition-colors hover:text-brand-400" style={{ color: "var(--text-muted)" }}>Compare</Link></li>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <li style={{ color: "var(--text-primary)" }}>{a.brand} {a.name} vs {b.brand} {b.name}</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="mb-10 max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#14b8a6" }}>Paddle Comparison</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
              {a.brand} {a.name} vs {b.brand} {b.name}
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
              A side-by-side spec, value, and use-case comparison of two of the most-searched pickleball paddles. Below: the
              attributes each paddle wins, a full spec table, and a clear recommendation for who should buy which.
            </p>
          </div>

          {/* Hero cards — paddle vs paddle */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-4 md:gap-6 mb-12">
            <PaddleHeroCard paddle={a} side="left" />
            <div className="flex items-center justify-center">
              <span
                className="text-xl font-extrabold uppercase tracking-[0.3em] px-4 py-2 rounded-full"
                style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)" }}
              >
                vs
              </span>
            </div>
            <PaddleHeroCard paddle={b} side="right" />
          </div>

          {/* Verdict cards — programmatic */}
          {verdicts.length > 0 && (
            <div className="mb-14">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
                Who wins on what
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {verdicts.map(({ label, result }) => {
                  const winnerPaddle = result.which === "a" ? a : result.which === "b" ? b : null;
                  return (
                    <div
                      key={label}
                      className="rounded-2xl p-5"
                      style={{
                        background: "var(--bg-card)",
                        border: `1px solid ${result.which === "tie" ? "rgba(255,255,255,0.08)" : "rgba(20,184,166,0.25)"}`,
                      }}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                        {label}
                      </p>
                      <div className="flex items-center gap-2 mb-1">
                        {result.which === "tie" ? (
                          <Minus className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        ) : (
                          <Trophy className="w-4 h-4" style={{ color: "#f4d28a" }} />
                        )}
                        <p className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                          {winnerPaddle ? `${winnerPaddle.brand} ${winnerPaddle.name}` : "Tie"}
                        </p>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {result.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full spec table */}
          <div className="mb-14">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
              Side-by-side specs
            </h2>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {[
                { label: "Brand", aVal: a.brand, bVal: b.brand },
                { label: "Model", aVal: a.name, bVal: b.name },
                { label: "Shape", aVal: a.shape, bVal: b.shape },
                { label: "Thickness", aVal: a.thickness, bVal: b.thickness },
                { label: "Weight", aVal: a.weight || "—", bVal: b.weight || "—" },
                { label: "Swing Weight", aVal: a.swingWeight ? a.swingWeight.toString() : "—", bVal: b.swingWeight ? b.swingWeight.toString() : "—", winA: a.swingWeight > b.swingWeight, winB: b.swingWeight > a.swingWeight },
                { label: "Twist Weight", aVal: a.twistWeight ? a.twistWeight.toString() : "—", bVal: b.twistWeight ? b.twistWeight.toString() : "—", winA: a.twistWeight > b.twistWeight, winB: b.twistWeight > a.twistWeight },
                { label: "Play Style", aVal: a.playStyle ?? "—", bVal: b.playStyle ?? "—" },
                { label: "Retail Price", aVal: a.price ?? "—", bVal: b.price ?? "—" },
                { label: "Discount", aVal: a.amountOff && a.amountOff !== "$0" ? `${a.amountOff} (PLAYBOOK)` : "—", bVal: b.amountOff && b.amountOff !== "$0" ? `${b.amountOff} (PLAYBOOK)` : "—" },
                {
                  label: "Effective Price",
                  aVal: aEff !== Infinity ? `$${aEff.toFixed(2)}` : "—",
                  bVal: bEff !== Infinity ? `$${bEff.toFixed(2)}` : "—",
                  winA: aEff !== Infinity && bEff !== Infinity && aEff < bEff,
                  winB: aEff !== Infinity && bEff !== Infinity && bEff < aEff,
                },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1fr_1.2fr_1.2fr] items-center px-5 py-3"
                  style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{row.label}</p>
                  <SpecCell value={row.aVal} winner={row.winA} />
                  <SpecCell value={row.bVal} winner={row.winB} />
                </div>
              ))}
            </div>
          </div>

          {/* Buy CTAs side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
            <BuyBlock paddle={a} />
            <BuyBlock paddle={b} />
          </div>

          {/* Newsletter content upgrade */}
          <InlineNewsletterCTA
            headline="See more comparisons like this — straight to your inbox"
            subline="Weekly paddle picks, fresh comparisons, and exclusive discount codes."
          />

          {/* Who should buy which */}
          <div className="mb-14 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
              Which paddle should you buy?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WhoCard paddle={a} other={b} />
              <WhoCard paddle={b} other={a} />
            </div>
          </div>

          {/* CTA back to compare hub + paddle pages */}
          <div className="mt-16 flex flex-col items-center text-center gap-5">
            <p className="text-base" style={{ color: "var(--text-muted)" }}>Compare other paddles in our database</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
                style={{ background: "#14b8a6" }}
              >
                Open the comparison tool <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/paddles"
                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-primary)" }}
              >
                Browse all paddles
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PaddleHeroCard({ paddle, side }: { paddle: Paddle; side: "left" | "right" }) {
  return (
    <Link
      href={`/paddles/${paddle.slug}`}
      className="block rounded-2xl p-6 transition-transform hover:scale-[1.01]"
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      }}
    >
      <div
        className="w-full rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--bg-alt)", aspectRatio: "1/1" }}
      >
        {paddle.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={paddle.image}
            alt={`${paddle.brand} ${paddle.name} ${paddle.shape} pickleball paddle`}
            className="w-full h-full object-contain p-4"
            style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.4))" }}
          />
        )}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#14b8a6" }}>{paddle.brand}</p>
      <p className="text-lg font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>{paddle.name}</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        {paddle.shape} · {paddle.thickness} {paddle.price ? `· ${paddle.price}` : ""}
      </p>
    </Link>
  );
}

function SpecCell({ value, winner }: { value: string; winner?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="text-sm font-bold font-mono"
        style={{ color: winner ? "#2dd4bf" : "var(--text-primary)" }}
      >
        {value}
      </span>
      {winner && <Trophy className="w-3.5 h-3.5" style={{ color: "#f4d28a" }} />}
    </div>
  );
}

function BuyBlock({ paddle }: { paddle: Paddle }) {
  const code = getCode(paddle.brand, paddle.discountLink);
  const hasDiscount = !!paddle.amountOff && paddle.amountOff !== "$0" && paddle.amountOff !== "";
  const price = fmtPrice(paddle);
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
        {paddle.brand}
      </p>
      <p className="text-base font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
        {paddle.name}
      </p>
      {price && (
        <p className="text-sm font-bold mb-3" style={{ color: "#2dd4bf" }}>{price}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {paddle.discountLink && (
          <a
            href={paddle.discountLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1.5 font-bold text-sm px-4 py-2 rounded-xl text-white"
            style={{ background: "#14b8a6" }}
          >
            {hasDiscount ? `Get ${paddle.amountOff} off` : "Buy"} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <span className="text-xs font-mono font-bold px-2 py-1 rounded-md" style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}>
          {code}
        </span>
        <Link
          href={`/paddles/${paddle.slug}`}
          className="text-xs font-semibold ml-auto"
          style={{ color: "var(--text-muted)" }}
        >
          Full review →
        </Link>
      </div>
    </div>
  );
}

function WhoCard({ paddle, other }: { paddle: Paddle; other: Paddle }) {
  const points: string[] = [];
  if (paddle.swingWeight > other.swingWeight + 1) points.push(`You want more power — SW ${paddle.swingWeight} is ${(paddle.swingWeight - other.swingWeight).toFixed(2)} points higher.`);
  if (paddle.swingWeight < other.swingWeight - 1) points.push(`You want faster hands — lower SW (${paddle.swingWeight} vs ${other.swingWeight}) means quicker maneuvering at the kitchen.`);
  if (paddle.twistWeight > other.twistWeight + 0.1) points.push(`You want a bigger sweet spot — TW ${paddle.twistWeight} is more forgiving on off-center hits.`);
  const pEff = effectivePrice(paddle);
  const oEff = effectivePrice(other);
  if (pEff !== Infinity && oEff !== Infinity && pEff < oEff - 5) points.push(`You're price-conscious — about $${(oEff - pEff).toFixed(0)} cheaper after PLAYBOOK discount.`);
  if (paddle.playStyle && paddle.playStyle !== other.playStyle) points.push(`Your game leans ${paddle.playStyle === "all-court" ? "all-court" : paddle.playStyle} — this is tuned for that style.`);
  if (paddle.shape !== other.shape) points.push(`You prefer the ${paddle.shape.toLowerCase()} shape — different feel/reach/sweet-spot profile from the ${other.shape.toLowerCase()}.`);

  if (points.length === 0) points.push(`You've already decided this is your brand or build preference.`);

  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
        Pick the {paddle.brand} {paddle.name} if…
      </p>
      <ul className="flex flex-col gap-2">
        {points.map((pt, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-snug" style={{ color: "var(--text-muted)" }}>
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#14b8a6" }} strokeWidth={2.5} />
            <span>{pt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
