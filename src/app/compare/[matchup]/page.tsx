import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, Check, Trophy, Minus } from "lucide-react";
import { getPaddleBySlug, comparisonVideos } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import { effectivePrice } from "@/lib/price";
import type { Paddle } from "@/types";
import InlineNewsletterCTA from "@/components/InlineNewsletterCTA";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { parseMatchup, canonicalMatchup, buildStaticMatchups, shouldComparePaddles } from "./helpers";

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

// ── Content generation ────────────────────────────────────────────────────────

function generateIntro(a: Paddle, b: Paddle, aEff: number, bEff: number): string {
  const sentences: string[] = [];
  const swDiff = Math.abs(a.swingWeight - b.swingWeight);
  const [highSW, lowSW] = a.swingWeight >= b.swingWeight ? [a, b] : [b, a];

  if (swDiff >= 3) {
    sentences.push(
      `The ${highSW.brand} ${highSW.name} carries a clear SW advantage — ${highSW.swingWeight} versus ${lowSW.swingWeight} on the ${lowSW.brand} ${lowSW.name} — a ${swDiff.toFixed(2)}-point gap that means noticeably heavier drives and more power from the ${highSW.name}.`
    );
  } else if (swDiff >= 0.5) {
    sentences.push(
      `The ${a.brand} ${a.name} (SW ${a.swingWeight}) and ${b.brand} ${b.name} (SW ${b.swingWeight}) sit ${swDiff.toFixed(2)} swing-weight points apart — close enough that shape, feel, and price become the real differentiators.`
    );
  } else {
    sentences.push(
      `The ${a.brand} ${a.name} and ${b.brand} ${b.name} are nearly identical in swing weight (${a.swingWeight} vs ${b.swingWeight}), making build quality, surface feel, and brand preference the deciding factors.`
    );
  }

  if (a.twistWeight && b.twistWeight) {
    const twDiff = Math.abs(a.twistWeight - b.twistWeight);
    if (twDiff >= 0.3) {
      const [highTW, lowTW] = a.twistWeight >= b.twistWeight ? [a, b] : [b, a];
      sentences.push(
        `The ${highTW.brand} ${highTW.name} also has the wider sweet spot — TW ${highTW.twistWeight} versus ${lowTW.twistWeight} — meaning more forgiveness on off-center hits.`
      );
    }
  }

  if (a.shape !== b.shape) {
    sentences.push(
      `Shape adds another dimension: the ${a.name} is ${a.shape.toLowerCase()}, the ${b.name} is ${b.shape.toLowerCase()}, which changes reach, kitchen feel, and sweet-spot position.`
    );
  }

  if (aEff !== Infinity && bEff !== Infinity && Math.abs(aEff - bEff) > 10) {
    const cheap = aEff <= bEff ? a : b;
    const diff = Math.abs(aEff - bEff).toFixed(0);
    sentences.push(
      `On price, the ${cheap.brand} ${cheap.name} is $${diff} less expensive after the PLAYBOOK discount.`
    );
  }

  return sentences.join(" ");
}

interface FAQ { q: string; a: string }

function generateFAQs(a: Paddle, b: Paddle, aEff: number, bEff: number): FAQ[] {
  const faqs: FAQ[] = [];
  const [powerWin, powerLose] = a.swingWeight >= b.swingWeight ? [a, b] : [b, a];
  const swDiff = Math.abs(a.swingWeight - b.swingWeight).toFixed(2);

  faqs.push({
    q: `Is the ${a.brand} ${a.name} or the ${b.brand} ${b.name} better for power?`,
    a: `The ${powerWin.brand} ${powerWin.name} generates more power — SW ${powerWin.swingWeight} vs ${powerLose.swingWeight} on the ${powerLose.brand} ${powerLose.name}, a ${swDiff}-point gap that adds mass and momentum at contact. If you prioritize hand speed and maneuverability over raw power, the ${powerLose.name}'s lower swing weight is the advantage.`,
  });

  if (a.twistWeight && b.twistWeight) {
    const [twWin, twLose] = a.twistWeight >= b.twistWeight ? [a, b] : [b, a];
    faqs.push({
      q: `Which paddle is more forgiving — the ${a.brand} ${a.name} or the ${b.brand} ${b.name}?`,
      a: `The ${twWin.brand} ${twWin.name} is more forgiving with a twist weight of ${twWin.twistWeight} vs ${twLose.twistWeight} on the ${twLose.brand} ${twLose.name}. Higher twist weight reduces energy loss on off-center hits, which matters most for kitchen-heavy players who take a lot of dinks and resets.`,
    });
  }

  if (aEff !== Infinity && bEff !== Infinity) {
    const cheap = aEff <= bEff ? a : b;
    const diff = Math.abs(aEff - bEff).toFixed(2);
    faqs.push({
      q: `What is the price difference between the ${a.brand} ${a.name} and the ${b.brand} ${b.name}?`,
      a: `With the PLAYBOOK discount code, the ${a.brand} ${a.name} is $${aEff.toFixed(2)} and the ${b.brand} ${b.name} is $${bEff.toFixed(2)}. The ${cheap.brand} ${cheap.name} is $${diff} cheaper. Apply PLAYBOOK at checkout on either brand's site to get the discount.`,
    });
  }

  if (a.shape !== b.shape) {
    const shapeNote = (p: Paddle) =>
      p.shape === "Elongated"
        ? "extra reach and a higher sweet spot — better for drives, resets, and transition-zone play"
        : p.shape === "Hybrid"
        ? "a balance of reach and maneuverability — versatile for both the kitchen and the baseline"
        : "a wider face and maximum forgiveness — tuned for kitchen play and the soft game";
    faqs.push({
      q: `How does the shape difference affect how the ${a.brand} ${a.name} and ${b.brand} ${b.name} play?`,
      a: `The ${a.brand} ${a.name}'s ${a.shape.toLowerCase()} shape delivers ${shapeNote(a)}. The ${b.brand} ${b.name}'s ${b.shape.toLowerCase()} gives ${shapeNote(b)}. For players who live at the kitchen line, that shape distinction often matters more than a 1–2 point SW difference.`,
    });
  }

  return faqs;
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
  if (!shouldComparePaddles(a, b)) notFound();

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

  // ── FAQ content ───────────────────────────────────────────────────────────
  const faqs = generateFAQs(a, b, aEff, bEff);

  // ── Related comparisons ───────────────────────────────────────────────────
  const relatedMatchups = buildStaticMatchups()
    .filter((m) => {
      if (m === canonicalMatchup(a.slug, b.slug)) return false;
      return (
        m.startsWith(a.slug + "-vs-") || m.endsWith("-vs-" + a.slug) ||
        m.startsWith(b.slug + "-vs-") || m.endsWith("-vs-" + b.slug)
      );
    })
    .slice(0, 6);

  // ── Structured data ───────────────────────────────────────────────────────
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
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(({ q, a: ans }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": ans },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

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
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#5a9df9" }}>Paddle Comparison</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
              {a.brand} {a.name} vs {b.brand} {b.name}
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {generateIntro(a, b, aEff, bEff)}
            </p>
          </div>

          {/* Hero cards — paddle vs paddle */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-4 md:gap-6 mb-12">
            <PaddleHeroCard paddle={a} side="left" />
            <div className="flex items-center justify-center">
              <span
                className="text-xl font-extrabold uppercase tracking-[0.3em] px-4 py-2 rounded-full"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border)", background: "var(--bg-section)" }}
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
                        border: `1px solid ${result.which === "tie" ? "var(--border)" : "rgba(90,157,249,0.3)"}`,
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
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
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
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
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

          {/* Head-to-head review video */}
          {(() => {
            const match = comparisonVideos[canonicalMatchup(a.slug, b.slug)];
            if (!match) return null;
            return (
              <div className="mb-14 max-w-3xl">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
                  Watch the Head-to-Head Review
                </h2>
                <YouTubeEmbed
                  videoId={match.videoId}
                  title={match.title}
                  customThumbnail={match.thumbnail}
                />
              </div>
            );
          })()}

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

          {/* FAQ section */}
          {faqs.length > 0 && (
            <div className="mb-14 max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
                Frequently asked questions
              </h2>
              <div className="flex flex-col gap-4">
                {faqs.map(({ q, a: ans }) => (
                  <div
                    key={q}
                    className="rounded-2xl p-6"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-base font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>{q}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{ans}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related comparisons */}
          {relatedMatchups.length > 0 && (
            <div className="mb-14">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
                Related comparisons
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {relatedMatchups.map((m) => {
                  const rel = parseMatchup(m);
                  if (!rel) return null;
                  const pa = getPaddleBySlug(rel[0]);
                  const pb = getPaddleBySlug(rel[1]);
                  if (!pa || !pb) return null;
                  return (
                    <Link
                      key={m}
                      href={`/compare/${m}`}
                      className="rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.02]"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      <span>{pa.brand} {pa.name}</span>
                      <span className="mx-1.5 font-normal" style={{ color: "var(--text-muted)" }}>vs</span>
                      <span>{pb.brand} {pb.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA back to compare hub + paddle pages */}
          <div className="mt-16 flex flex-col items-center text-center gap-5">
            <p className="text-base" style={{ color: "var(--text-muted)" }}>Compare other paddles in our database</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
                style={{ background: "#5a9df9" }}
              >
                Open the comparison tool <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/paddles"
                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
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
        border: "1px solid var(--border)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      }}
    >
      <div
        className="w-full rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--bg-alt)", aspectRatio: "4/5" }}
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
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#5a9df9" }}>{paddle.brand}</p>
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
        style={{ color: winner ? "#0a64bc" : "var(--text-primary)" }}
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
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
        {paddle.brand}
      </p>
      <p className="text-base font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
        {paddle.name}
      </p>
      {price && (
        <p className="text-sm font-bold mb-3" style={{ color: "#5a9df9" }}>{price}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {paddle.discountLink && (
          <a
            href={paddle.discountLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1.5 font-bold text-sm px-4 py-2 rounded-xl text-white"
            style={{ background: "#5a9df9" }}
          >
            {hasDiscount ? `Get ${paddle.amountOff} off` : "Buy"} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <span className="text-xs font-mono font-bold px-2 py-1 rounded-md" style={{ background: "rgba(90,157,249,0.15)", color: "#5a9df9" }}>
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
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#5a9df9" }}>
        Pick the {paddle.brand} {paddle.name} if…
      </p>
      <ul className="flex flex-col gap-2">
        {points.map((pt, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-snug" style={{ color: "var(--text-muted)" }}>
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#5a9df9" }} strokeWidth={2.5} />
            <span>{pt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
