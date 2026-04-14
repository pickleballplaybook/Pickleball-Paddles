import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getPaddleBySlug, paddles } from "@/data/paddles";
import { fetchPlaylistVideos, getVideoForPaddle } from "@/lib/youtube";
import { siteConfig } from "@/config/site";
import PerformanceBar from "@/components/PerformanceBar";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import SubstackCard from "@/components/SubstackCard";
import PaddleCard from "@/components/PaddleCard";
import { ArrowLeft, ArrowRight, Tag, Gift, BarChart2, ExternalLink } from "lucide-react";
import ReactionButtons from "@/components/ReactionButtons";

interface Props {
  params: { slug: string };
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return paddles.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const paddle = getPaddleBySlug(params.slug);
  if (!paddle) return {};
  const code = getDiscountCode(paddle.brand, paddle.discountLink);
  return {
    title: `${paddle.name} (${paddle.shape}) | ${paddle.brand} | Pickleball Playbook`,
    description: `${paddle.brand} ${paddle.name} specs, review, and discount. Use code ${code} at checkout. ${paddle.thickness} core · ${paddle.weight} · Swing Weight ${paddle.swingWeight}.`,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDiscountCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

function isSelkirkGiftCard(brand: string, amountOff: string): boolean {
  return (brand === "Selkirk" || brand === "SLK") && (amountOff === "$0" || amountOff === "" || !amountOff);
}

function savingsDisplay(amountOff: string): string {
  if (!amountOff || amountOff === "$0") return "";
  return `Save ${amountOff}`;
}

// ── Spec row ──────────────────────────────────────────────────────────────────

function SpecRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string | number | undefined;
  last?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div
      className={`flex items-center justify-between py-3.5 ${!last ? "border-b" : ""}`}
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <span className="text-sm font-medium" style={{ color: "var(--flip-text-muted)" }}>
        {label}
      </span>
      <span className="text-sm font-bold font-mono" style={{ color: "var(--flip-text-head)" }}>
        {value}
      </span>
    </div>
  );
}

// ── Play style labels ─────────────────────────────────────────────────────────

const STYLE_LABELS: Record<string, string> = {
  power:       "Power Hitter",
  control:     "Control Player",
  "all-court": "All-Court",
  spin:        "Spin Specialist",
};

// ─────────────────────────────────────────────────────────────────────────────

export default async function PaddleDetailPage({ params }: Props) {
  const paddle = getPaddleBySlug(params.slug);
  if (!paddle) notFound();

  const playlistVideos = await fetchPlaylistVideos();
  const { videoId }    = await getVideoForPaddle(
    { ...paddle, manualVideoId: paddle.manualVideoId ?? "" } as Parameters<typeof getVideoForPaddle>[0],
    playlistVideos
  );

  const related  = paddles.filter((p) => p.id !== paddle.id).slice(0, 3);
  const code     = getDiscountCode(paddle.brand, paddle.discountLink);
  const giftCard = isSelkirkGiftCard(paddle.brand, paddle.amountOff);
  const savings  = savingsDisplay(paddle.amountOff);
  const hasLink  = !!paddle.discountLink?.trim();

  return (
    <div className="min-h-screen pt-[156px]" style={{ background: "var(--flip-bg)" }}>

      {/* Back nav */}
      <div className="container-xl pt-8 mb-6">
        <Link
          href="/paddles"
          className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-brand-500"
          style={{ color: "var(--flip-text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          All Paddles
        </Link>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="container-xl pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Left — image */}
          <div
            className="rounded-3xl aspect-square flex flex-col items-center justify-center border"
            style={{
              background: "var(--flip-bg-card)",
              borderColor: "var(--flip-card-border)",
            }}
          >
            {paddle.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={paddle.image} alt={paddle.name} className="w-full h-full object-contain p-10" />
            ) : (
              <>
                <svg viewBox="0 0 120 160" fill="none" className="w-32 h-auto mb-4 opacity-20" aria-hidden="true">
                  <rect x="5" y="5" width="110" height="115" rx="55" fill="#14b8a6" />
                  <rect x="45" y="116" width="30" height="40" rx="15" fill="#0d9488" />
                </svg>
                <p className="text-sm font-medium" style={{ color: "var(--flip-text-muted)" }}>
                  Image coming soon
                </p>
              </>
            )}
            {paddle.badge && (
              <span className="mt-4 badge badge-amber text-sm px-3 py-1">{paddle.badge}</span>
            )}
          </div>

          {/* Right — info panel */}
          <div className="lg:pt-2">

            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
              {paddle.brand}
            </p>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] mb-1"
              style={{ color: "var(--flip-text-head)" }}
            >
              {paddle.name}
            </h1>
            <p className="text-base font-medium mb-6" style={{ color: "var(--flip-text-muted)" }}>
              {paddle.shape} · {paddle.thickness} core
            </p>

            {paddle.tagline && (
              <p className="text-lg font-light mb-6" style={{ color: "var(--flip-text-body)" }}>
                {paddle.tagline}
              </p>
            )}

            {/* Specs grid */}
            <div
              className="rounded-2xl px-6 py-1 mb-6"
              style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
            >
              <SpecRow label="Brand"        value={paddle.brand}       />
              <SpecRow label="Shape"        value={paddle.shape}       />
              <SpecRow label="Weight"       value={paddle.weight}      />
              <SpecRow label="Swing Weight" value={paddle.swingWeight} />
              <SpecRow label="Twist Weight" value={paddle.twistWeight} />
              <SpecRow label="Thickness"    value={paddle.thickness}   last />
            </div>

            {paddle.price && (
              <p className="text-3xl font-extrabold mb-5" style={{ color: "var(--flip-text-head)" }}>
                {paddle.price}
              </p>
            )}

            {/* Discount / code box */}
            <div
              className="rounded-2xl p-5 mb-4"
              style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.22)" }}
            >
              {giftCard ? (
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(20,184,166,0.15)" }}
                  >
                    <Gift className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1" style={{ color: "var(--flip-text-head)" }}>
                      Free e-Gift Card with Purchase
                    </p>
                    <p className="text-sm" style={{ color: "var(--flip-text-body)" }}>
                      Use code{" "}
                      <span
                        className="font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{ color: "#2dd4bf", background: "rgba(20,184,166,0.15)" }}
                      >
                        {code}
                      </span>
                      {" "}at checkout to receive a free Selkirk e-gift card with your purchase.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(20,184,166,0.15)" }}
                    >
                      <Tag className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                        style={{ color: "var(--flip-text-muted)" }}
                      >
                        Discount Code
                      </p>
                      <p className="font-mono font-extrabold text-lg tracking-widest" style={{ color: "#2dd4bf" }}>
                        {code}
                      </p>
                    </div>
                  </div>
                  {savings && (
                    <div
                      className="rounded-xl px-4 py-2 text-center"
                      style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.2)" }}
                    >
                      <p className="text-2xl font-extrabold" style={{ color: "#2dd4bf" }}>{savings}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Buy Now / Link Coming Soon */}
            {hasLink ? (
              <a
                href={paddle.discountLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full font-bold text-base py-4 rounded-2xl text-white transition-all duration-200 active:scale-[0.98]"
                style={{ background: "#14b8a6" }}
              >
                Buy Now
                <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
              </a>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 w-full font-bold text-base py-4 rounded-2xl cursor-not-allowed"
                style={{
                  background: "var(--flip-bg-card)",
                  color: "var(--flip-text-muted)",
                  border: "1px solid var(--flip-card-border)",
                }}
              >
                Link Coming Soon
              </button>
            )}

            {/* Save / React */}
            <div className="mt-3">
              <ReactionButtons paddleId={paddle.id} />
            </div>
          </div>
        </div>
      </section>

      {/* ── PERFORMANCE METRICS ───────────────────────────────────────────── */}
      {paddle.ratings && (
        <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
          <div className="container-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

              <div>
                <div className="flex items-center gap-2 mb-8">
                  <BarChart2 className="w-5 h-5" style={{ color: "#14b8a6" }} />
                  <h2 className="text-2xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
                    Performance Metrics
                  </h2>
                </div>
                <div
                  className="rounded-2xl p-6 space-y-8"
                  style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}
                >
                  <PerformanceBar label="Power"      value={paddle.ratings.power}     />
                  <PerformanceBar label="Spin"       value={paddle.ratings.spin}      />
                  <PerformanceBar label="Pop"        value={paddle.ratings.pop}       />
                  <PerformanceBar label="Hand Speed" value={paddle.ratings.handSpeed} />
                  <PerformanceBar label="Control"    value={paddle.ratings.control}   />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold mb-8" style={{ color: "var(--flip-text-head)" }}>
                  Play Style Match
                </h2>
                <div
                  className="rounded-2xl p-6 space-y-4"
                  style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}
                >
                  {paddle.description && (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body)" }}>
                      {paddle.description}
                    </p>
                  )}
                  {paddle.playStyle && (
                    <div className="pt-4 border-t" style={{ borderColor: "var(--flip-divider)" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                         style={{ color: "var(--flip-text-muted)" }}>Best for</p>
                      <span
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold"
                        style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.2)" }}
                      >
                        {STYLE_LABELS[paddle.playStyle] ?? paddle.playStyle}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Play Style Match — no ratings */}
      {!paddle.ratings && (paddle.playStyle || paddle.description) && (
        <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
          <div className="container-xl max-w-2xl">
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--flip-text-head)" }}>
              Play Style Match
            </h2>
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}
            >
              {paddle.description && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body)" }}>
                  {paddle.description}
                </p>
              )}
              {paddle.playStyle && (
                <div className="pt-4 border-t" style={{ borderColor: "var(--flip-divider)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                     style={{ color: "var(--flip-text-muted)" }}>Best for</p>
                  <span
                    className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.2)" }}
                  >
                    {STYLE_LABELS[paddle.playStyle] ?? paddle.playStyle}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── VIDEO REVIEW ──────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container-xl max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
              Video Review
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
              {videoId ? "Watch Full Paddle Review" : "No Review Yet"}
            </h2>
          </div>
          <YouTubeEmbed
            videoId={videoId ?? ""}
            title={`${paddle.name} — Full Review`}
          />
        </div>
      </section>

      {/* ── BUY CTA ───────────────────────────────────────────────────────── */}
      {hasLink && (
        <section
          className="py-12"
          style={{
            background: "rgba(20,184,166,0.06)",
            borderTop: "1px solid rgba(20,184,166,0.12)",
            borderBottom: "1px solid rgba(20,184,166,0.12)",
          }}
        >
          <div className="container-xl max-w-2xl mx-auto text-center">
            <p className="font-bold text-xl mb-2" style={{ color: "var(--flip-text-head)" }}>
              Ready to grab the{" "}
              <span style={{ color: "#2dd4bf" }}>{paddle.name}</span>?
            </p>
            <p className="mb-6 text-sm" style={{ color: "var(--flip-text-body)" }}>
              {giftCard
                ? `Use code ${code} for a free e-gift card with your purchase.`
                : `Use code ${code} at checkout${savings ? ` — ${savings}` : ""}.`}
            </p>
            <a
              href={paddle.discountLink}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-2 font-bold text-base px-10 py-4 rounded-2xl text-white transition-all duration-200 active:scale-[0.98]"
              style={{ background: "#14b8a6" }}
            >
              Buy Now
              <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
            </a>
          </div>
        </section>
      )}

      {/* ── NEWSLETTER ────────────────────────────────────────────────────── */}
      <section className="py-10">
        <div className="container-xl max-w-3xl mx-auto">
          <SubstackCard variant="banner" />
        </div>
      </section>

      {/* ── RELATED PADDLES ───────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
        <div className="container-xl">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
              More Paddles
            </h2>
            <Link
              href="/paddles"
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-brand-400"
              style={{ color: "#14b8a6" }}
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <PaddleCard key={p.id} paddle={p} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
