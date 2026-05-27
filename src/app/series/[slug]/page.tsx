import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { paddles } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import { ArrowRight, ExternalLink, ChevronRight } from "lucide-react";
import type { Paddle } from "@/types";
import { extractYouTubeId } from "@/lib/youtube";
import YouTubeEmbed from "@/components/YouTubeEmbed";

interface Props {
  params: { slug: string };
}

// ── Build series map ──────────────────────────────────────────────────────────

interface Series {
  slug: string;
  brand: string;
  title: string;
  paddles: Paddle[];
}

function getAllSeries(): Series[] {
  const map = new Map<string, Paddle[]>();
  for (const p of paddles) {
    if (!p.seriesSlug) continue;
    const arr = map.get(p.seriesSlug) ?? [];
    arr.push(p);
    map.set(p.seriesSlug, arr);
  }

  return Array.from(map.entries())
    .filter(([, arr]) => arr.length >= 2)
    .map(([slug, arr]) => {
      const brand = arr[0].brand;
      // Build a friendly title from the common parts of the names
      const names = arr.map((p) => p.name);
      const commonWords = names[0].split(" ").filter((w) =>
        names.every((n) => n.toLowerCase().includes(w.toLowerCase()))
      );
      const title = commonWords.length > 0
        ? `${brand} ${commonWords.join(" ")} Series`
        : `${brand} ${names[0]} Series`;
      return { slug, brand, title, paddles: arr };
    });
}

function getSeriesBySlug(slug: string): Series | undefined {
  return getAllSeries().find((s) => s.slug === slug);
}

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getAllSeries().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const series = getSeriesBySlug(params.slug);
  if (!series) return {};
  const shapes = series.paddles.map((p) => p.shape).join(", ");
  const url = `${siteConfig.siteUrl}/series/${series.slug}`;
  const imageUrl = series.paddles[0]?.image ? `${siteConfig.siteUrl}${series.paddles[0].image}` : undefined;
  return {
    title: `${series.title} — ${shapes}`,
    description: `Compare all ${series.paddles.length} shapes in the ${series.title}. Specs, reviews, and discount codes for every shape. Use code PLAYBOOK at checkout.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${series.title} — Compare All Shapes`,
      description: `Compare ${shapes} shapes in the ${series.title} series. Lab-measured specs and discount codes.`,
      url,
      type: "website",
      siteName: siteConfig.name,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: `${series.title} pickleball paddles` }] } : {}),
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

function calcDiscountedPrice(price: string, amountOff: string): string | null {
  if (!price || !amountOff || amountOff === "$0" || amountOff === "") return null;
  const base = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(base) || base <= 0) return null;
  let discounted: number;
  if (amountOff.endsWith("%")) {
    discounted = base * (1 - parseFloat(amountOff) / 100);
  } else {
    discounted = base - parseFloat(amountOff.replace(/[^0-9.]/g, ""));
  }
  if (discounted <= 0) return null;
  return `$${discounted.toFixed(2)}`;
}

const SHAPE_ORDER: Record<string, number> = { Hybrid: 1, Elongated: 2, Widebody: 3 };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SeriesPage({ params }: Props) {
  const series = getSeriesBySlug(params.slug);
  if (!series) notFound();

  const sorted = [...series.paddles].sort(
    (a, b) => (SHAPE_ORDER[a.shape] ?? 9) - (SHAPE_ORDER[b.shape] ?? 9)
  );

  const code = getCode(series.brand, sorted[0]?.discountLink);

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--flip-bg)" }}>

      {/* Breadcrumbs */}
      <nav className="container-xl pt-6 pb-4" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider flex-wrap">
          <li>
            <Link href="/paddles" className="transition-colors hover:text-brand-400" style={{ color: "var(--flip-text-muted)" }}>Paddles</Link>
          </li>
          <ChevronRight className="w-3 h-3" style={{ color: "var(--flip-text-muted)" }} />
          <li style={{ color: "var(--flip-text-head)" }}>{series.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <section className="container-xl pb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
          {series.brand} &middot; {sorted.length} Shapes
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] mb-3" style={{ color: "var(--flip-text-head)" }}>
          {series.title}
        </h1>
        <p className="text-base mb-2" style={{ color: "var(--flip-text-body)" }}>
          Compare all {sorted.length} shapes side by side. Use code{" "}
          <span className="font-mono font-bold" style={{ color: "#2dd4bf" }}>{code}</span>
          {" "}at checkout.
        </p>
      </section>

      {/* Video review — show if any paddle in the series has a review */}
      {(() => {
        const videoIds = new Set<string>();
        for (const p of sorted) {
          if (p.reviewUrl) {
            const id = extractYouTubeId(p.reviewUrl);
            if (id) videoIds.add(id);
          }
          if (p.manualVideoId) videoIds.add(p.manualVideoId);
        }
        const uniqueIds = Array.from(videoIds);
        if (uniqueIds.length === 0) return null;
        return (
          <section className="container-xl pb-10">
            <div className="max-w-3xl">
              {uniqueIds.map((vid) => (
                <div key={vid} className="mb-4">
                  <YouTubeEmbed videoId={vid} title={`${series.title} Review`} />
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Shape cards */}
      <section className="container-xl">
        <div className={`grid grid-cols-1 ${sorted.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"} gap-6`}>
          {sorted.map((paddle) => (
            <div
              key={paddle.id}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
            >
              {/* Image */}
              <Link href={`/paddles/${paddle.slug}`} className="block">
                <div className="relative aspect-square flex items-center justify-center p-6" style={{ background: "var(--flip-bg)" }}>
                  {paddle.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={paddle.image} alt={`${paddle.brand} ${paddle.name}`} className="w-full h-full object-contain" />
                  )}
                  <span
                    className="absolute top-3 left-3 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.3)" }}
                  >
                    {paddle.shape}
                  </span>
                </div>
              </Link>

              {/* Info */}
              <div className="p-5 flex-1 flex flex-col">
                <Link href={`/paddles/${paddle.slug}`} className="group">
                  <h2 className="text-lg font-extrabold group-hover:text-teal-500 transition-colors mb-1" style={{ color: "var(--flip-text-head)" }}>
                    {paddle.name}
                  </h2>
                  <p className="text-sm mb-4" style={{ color: "var(--flip-text-muted)" }}>
                    {paddle.shape} &middot; {paddle.thickness} &middot; {paddle.weight}
                  </p>
                </Link>

                {/* Specs */}
                <div className="space-y-2 mb-5 flex-1">
                  <SpecLine label="Swing Weight" value={paddle.swingWeight > 0 ? String(paddle.swingWeight) : "TBD"} />
                  <SpecLine label="Twist Weight" value={paddle.twistWeight > 0 ? String(paddle.twistWeight) : "TBD"} />
                  <SpecLine label="Weight" value={paddle.weight} />
                  <SpecLine label="Thickness" value={paddle.thickness} />
                  {paddle.playStyle && (
                    <SpecLine
                      label="Play Style"
                      value={paddle.playStyle === "all-court" ? "All-Court" : paddle.playStyle === "power" ? "Power" : paddle.playStyle === "control" ? "Control" : paddle.playStyle}
                    />
                  )}
                </div>

                {/* Price + Buy */}
                <div className="mt-auto">
                  {paddle.price && (() => {
                    const discounted = paddle.amountOff ? calcDiscountedPrice(paddle.price, paddle.amountOff) : null;
                    return (
                      <div className="flex items-baseline gap-2 mb-3">
                        {discounted ? (
                          <>
                            <span className="text-lg font-semibold line-through" style={{ color: "var(--flip-text-muted)" }}>
                              {paddle.price}
                            </span>
                            <span className="text-2xl font-extrabold" style={{ color: "#2dd4bf" }}>
                              {discounted}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
                            {paddle.price}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex gap-2">
                    {paddle.discountLink ? (
                      <a
                        href={paddle.discountLink}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl text-white transition-all active:scale-[0.98]"
                        style={{ background: "#14b8a6" }}
                      >
                        Buy with Discount
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="flex-1 flex items-center justify-center text-sm py-3 rounded-xl" style={{ background: "var(--flip-bg)", color: "var(--flip-text-muted)", border: "1px solid var(--flip-card-border)" }}>
                        Coming Soon
                      </span>
                    )}
                    <Link
                      href={`/paddles/${paddle.slug}`}
                      className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-colors hover:border-teal-400"
                      style={{ borderColor: "var(--flip-card-border)", color: "var(--flip-text-head)" }}
                    >
                      Full Review <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="container-xl py-16">
        <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--flip-text-head)" }}>
          Quick Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: "var(--flip-text-body)" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--flip-divider)" }}>
                <th className="text-left py-3 pr-4 font-bold" style={{ color: "var(--flip-text-head)" }}>Spec</th>
                {sorted.map((p) => (
                  <th key={p.id} className="text-center py-3 px-3 font-bold" style={{ color: "var(--flip-text-head)" }}>
                    {p.shape}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Weight", fn: (p: Paddle) => p.weight },
                { label: "Swing Weight", fn: (p: Paddle) => p.swingWeight > 0 ? String(p.swingWeight) : "TBD" },
                { label: "Twist Weight", fn: (p: Paddle) => p.twistWeight > 0 ? String(p.twistWeight) : "TBD" },
                { label: "Thickness", fn: (p: Paddle) => p.thickness },
                { label: "Price", fn: (p: Paddle) => p.price ?? "TBD" },
                { label: "Discount", fn: (p: Paddle) => p.amountOff && p.amountOff !== "$0" ? p.amountOff : "—" },
              ].map((row) => (
                <tr key={row.label} style={{ borderBottom: "1px solid var(--flip-divider)" }}>
                  <td className="py-3 pr-4 font-medium" style={{ color: "var(--flip-text-muted)" }}>{row.label}</td>
                  {sorted.map((p) => (
                    <td key={p.id} className="text-center py-3 px-3 font-mono font-bold" style={{ color: "var(--flip-text-head)" }}>
                      {row.fn(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ── SpecLine helper ───────────────────────────────────────────────────────────

function SpecLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--flip-divider)" }}>
      <span className="text-xs" style={{ color: "var(--flip-text-muted)" }}>{label}</span>
      <span className="text-xs font-bold font-mono" style={{ color: "var(--flip-text-head)" }}>{value}</span>
    </div>
  );
}
