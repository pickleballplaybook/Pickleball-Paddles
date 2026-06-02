import Link from "next/link";
import { ArrowRight, ExternalLink, CheckCircle2 } from "lucide-react";
import { getPaddleBySlug } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import type { Paddle } from "@/types";
import InlineNewsletterCTA from "@/components/InlineNewsletterCTA";

// ── Pick + config types ──────────────────────────────────────────────────────

export interface PillarPick {
  slug: string;
  seriesSlugs?: string[];
  seriesName?: string;
  label: string;        // short superlative shown on the rank chip
  why: string;          // audience-tailored editorial
}

export interface PillarFaq {
  q: string;
  a: string;
}

export interface AudienceConfig {
  routeSlug: string;          // e.g. "for-beginners"
  eyebrow: string;            // e.g. "Beginner Picks"
  audienceShort: string;      // e.g. "beginners"
  headline: string;           // h1
  intro: string;              // hero paragraph
  trustSignals: string[];     // 3–4 short trust chips
  accent: string;             // section accent color
  picks: PillarPick[];
  buyingGuide: { heading: string; paragraphs: React.ReactNode[] };
  faq: PillarFaq[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

// ── View ─────────────────────────────────────────────────────────────────────

export default function AudiencePillarView({ config }: { config: AudienceConfig }) {
  const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${config.routeSlug}`;
  const ACCENT = config.accent;

  // JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteConfig.siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Best Pickleball Paddles", "item": `${siteConfig.siteUrl}/best-pickleball-paddles` },
      { "@type": "ListItem", "position": 3, "name": `For ${config.audienceShort}`, "item": PAGE_URL },
    ],
  };
  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": config.headline,
    "description": `The top ${config.picks.length} pickleball paddles for ${config.audienceShort}, ranked by Pickleball Playbook.`,
    "url": PAGE_URL,
    "numberOfItems": config.picks.length,
    "itemListElement": config.picks.map((pick, i) => {
      const p = getPaddleBySlug(pick.slug);
      return {
        "@type": "ListItem",
        "position": i + 1,
        "name": p ? `${p.brand} ${p.name}` : pick.slug,
        "url": `${siteConfig.siteUrl}/paddles/${pick.slug}`,
        ...(p?.image ? { "image": `${siteConfig.siteUrl}${p.image}` } : {}),
      };
    }),
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": config.faq.map(({ q, a }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl py-16">

          {/* Breadcrumbs */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <li><Link href="/" className="transition-colors hover:text-brand-400" style={{ color: "var(--text-muted)" }}>Home</Link></li>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <li><Link href="/best-pickleball-paddles" className="transition-colors hover:text-brand-400" style={{ color: "var(--text-muted)" }}>Best Paddles</Link></li>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <li style={{ color: "var(--text-primary)" }}>For {config.audienceShort.charAt(0).toUpperCase() + config.audienceShort.slice(1)}</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>
              {config.eyebrow}
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5" style={{ color: "var(--text-primary)" }}>
              {config.headline}
            </h1>
            <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
              {config.intro}
            </p>
            <div className="flex flex-wrap gap-4">
              {config.trustSignals.map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top picks */}
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
            Top {config.picks.length} Pickleball Paddles for {config.audienceShort.charAt(0).toUpperCase() + config.audienceShort.slice(1)}
          </h2>
          <div className="flex flex-col gap-10 mb-20">
            {config.picks.map((pick, i) => {
              const paddle = getPaddleBySlug(pick.slug);
              if (!paddle) return null;
              const seriesPaddles = pick.seriesSlugs
                ? (pick.seriesSlugs.map(getPaddleBySlug).filter(Boolean) as Paddle[])
                : null;
              const priceNum = paddle.price ? parseFloat(paddle.price.replace(/[^0-9.]/g, "")) : null;
              const code = getCode(paddle.brand, paddle.discountLink);
              const noDiscount = !paddle.amountOff || paddle.amountOff === "$0";
              const isSeries = !!(seriesPaddles && seriesPaddles.length > 1);

              return (
                <div key={pick.slug}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}50` }}>
                      #{i + 1} · {pick.label}
                    </span>
                    <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                  </div>

                  <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: i === 0 ? "0 16px 48px rgba(0,0,0,0.3)" : undefined }}>
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="md:w-[38%] flex-shrink-0 flex items-center justify-center p-10" style={{ background: "var(--bg-alt)", minHeight: "260px" }}>
                        {isSeries ? (
                          <div className="flex items-end" style={{ perspective: "800px" }}>
                            {seriesPaddles!.map((sp, si) => {
                              const translateY = si === 1 ? -12 : 0;
                              const rotate = si === 0 ? 5 : si === seriesPaddles!.length - 1 ? -5 : 0;
                              return (
                                <Link key={sp.slug} href={`/paddles/${sp.slug}`} className="relative transition-transform duration-300 hover:scale-105 hover:z-10" style={{ transform: `translateY(${translateY}px) rotate(${rotate}deg)`, marginLeft: si > 0 ? "-16px" : "0", zIndex: si === 1 ? 3 : 1 }}>
                                  <div className="flex flex-col items-center" style={{ width: "100px" }}>
                                    {sp.image && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={sp.image} alt={`${sp.brand} ${sp.name} ${sp.shape}`} className="w-full h-auto object-contain" style={{ maxHeight: "160px", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))" }} />
                                    )}
                                    <p className="text-[10px] font-bold text-center mt-1 truncate w-full" style={{ color: "rgba(255,255,255,0.6)" }}>{sp.shape}</p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={paddle.image ?? ""} alt={`${paddle.brand} ${paddle.name} pickleball paddle for ${config.audienceShort}`} className="w-full h-full object-contain" style={{ maxHeight: "200px", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{paddle.brand}</p>
                        <h3 className="text-2xl font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
                          {isSeries ? `${pick.seriesName ?? `${paddle.brand} ${paddle.name}`} Series` : `${paddle.brand} ${paddle.name}`}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>
                          {isSeries ? `${seriesPaddles!.map((sp) => sp.shape).join(", ")} · ${paddle.thickness}` : `${paddle.shape} · ${paddle.thickness}`}
                          {priceNum ? ` · $${priceNum.toFixed(2)}` : ""}
                          {!noDiscount ? ` (${paddle.amountOff} off)` : ""}
                        </p>
                        <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-muted)", maxWidth: "56ch" }}>{pick.why}</p>

                        <div className="flex flex-wrap gap-2 mb-6">
                          {[paddle.swingWeight ? `SW ${paddle.swingWeight}` : null, paddle.twistWeight ? `TW ${paddle.twistWeight}` : null, paddle.weight || null].filter(Boolean).map((s) => (
                            <span key={s as string} className="text-xs font-bold px-3 py-1.5 rounded-full font-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>{s}</span>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Link href={isSeries && paddle.seriesSlug ? `/series/${paddle.seriesSlug}` : `/paddles/${pick.slug}`} className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02]" style={{ background: ACCENT, color: "#0a1628" }}>
                            {isSeries ? "View Paddles" : "Full Review"} <ArrowRight className="w-4 h-4" />
                          </Link>
                          {paddle.discountLink && (
                            <a href={paddle.discountLink} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02]" style={{ border: `1.5px solid ${ACCENT}66`, color: ACCENT }}>
                              {noDiscount ? "Buy Now" : `Get Discount · ${code}`} <ExternalLink className="w-3.5 h-3.5" />
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

          {/* Newsletter CTA */}
          <InlineNewsletterCTA
            headline={`Get more picks for ${config.audienceShort} in your inbox`}
            subline="Weekly paddle reviews, exclusive discount codes, and what's worth buying — straight to your inbox."
          />

          {/* Buying guide */}
          <div className="mt-16 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
              {config.buyingGuide.heading}
            </h2>
            <div className="flex flex-col gap-4 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {config.buyingGuide.paragraphs.map((p, i) => (
                <div key={i}>{p}</div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>Common Questions</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-10" style={{ color: "var(--text-primary)" }}>FAQ</h2>
            <div className="flex flex-col gap-4">
              {config.faq.map(({ q, a }) => (
                <div key={q} className="p-6 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 className="font-bold text-base mb-2" style={{ color: "var(--text-primary)" }}>{q}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-20 flex flex-col items-center text-center gap-5">
            <p className="text-base" style={{ color: "var(--text-muted)" }}>
              Looking for paddles at every price point?
            </p>
            <Link href="/best-pickleball-paddles" className="inline-flex items-center gap-2 font-bold text-base px-10 py-4 rounded-2xl text-white transition-all duration-200 hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)", boxShadow: "0 0 40px rgba(20,184,166,0.4)" }}>
              See All Best Pickleball Paddles <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}

