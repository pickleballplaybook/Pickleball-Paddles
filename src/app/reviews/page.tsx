import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, Youtube } from "lucide-react";
import { paddles, reviewDates } from "@/data/paddles";
import { getReviewGroups } from "@/lib/youtube";
import { siteConfig } from "@/config/site";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import PromoBar from "@/components/PromoBar";
import { gearProducts } from "@/data/products";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "YouTube Reviews",
  description: `Watch full video reviews for every pickleball paddle listed on ${siteConfig.name}.`,
};

// Same hourly seed as homepage — slices [3,4] so reviews never duplicate homepage [0,1,2]
function hourSeededShuffle<T>(arr: T[]): T[] {
  const seed = Math.floor(Date.now() / 3600000);
  const out = [...arr];
  let s = seed | 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 13), 0x8d7ea0c3);
    const j = (s >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  return `${n} views`;
}

function PromoSlot({ product }: { product: typeof gearProducts[number] }) {
  return (
    <div className="my-10">
      <PromoBar
        title={`${product.brand} ${product.name}`}
        subtitle={product.subtitle}
        ctaText={product.ctaText}
        ctaHref={product.link}
        image={product.image || undefined}
        imageAlt={`${product.brand} ${product.name}`}
        badge={product.badge || undefined}
        bg={product.bg}
      />
    </div>
  );
}

export default async function ReviewsPage() {
  // Groups are deduped by video ID and sorted newest-first by publish date
  const groups = await getReviewGroups(paddles, reviewDates);

  // Slice [3,4] from the shared hourly shuffle — never overlaps with homepage [0,1,2]
  const shuffled = hourSeededShuffle(gearProducts);
  const [promoA, promoB] = [shuffled[3], shuffled[4]];

  // Chunk groups: [0..3], promo, [4..7], promo, [8+]
  const chunkA = groups.slice(0, 4);
  const chunkB = groups.slice(4, 8);
  const chunkC = groups.slice(8);

  function ReviewGrid({ items }: { items: typeof groups }) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {items.map((group) => (
          <div key={group.videoId} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide mb-0.5">
                {group.brand}
              </p>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {group.title}
              </h2>
              {group.viewCount !== undefined && (
                <p className="flex items-center gap-1 text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                  {formatViews(group.viewCount)}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {group.paddles.map(({ name, slug }) => (
                  <Link
                    key={slug}
                    href={`/paddles/${slug}`}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                    style={{
                      background: "var(--bg-alt)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {name}
                    <ArrowRight className="w-3 h-3 opacity-50" />
                  </Link>
                ))}
              </div>
            </div>
            <YouTubeEmbed videoId={group.videoId} title={group.title} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-20">

        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">
            Video Reviews
          </p>
          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            YouTube Reviews
          </h1>
          <p className="text-lg max-w-xl mb-6" style={{ color: "var(--text-muted)" }}>
            Watch full in-depth reviews for every paddle before you buy. Then use code{" "}
            <span className="font-mono font-semibold text-brand-600">{siteConfig.discountCode}</span>{" "}
            to save.
          </p>
          <a
            href={siteConfig.youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl transition-all hover:bg-red-100"
          >
            <Youtube className="w-4 h-4" />
            @pickleballplaybook on YouTube
          </a>
        </div>

        {/* Review grid with interleaved promos */}
        <ReviewGrid items={chunkA} />

        {chunkB.length > 0 && (
          <>
            <PromoSlot product={promoA} />
            <ReviewGrid items={chunkB} />
          </>
        )}

        {chunkC.length > 0 && (
          <>
            <PromoSlot product={promoB} />
            <ReviewGrid items={chunkC} />
          </>
        )}

      </div>
    </div>
  );
}
