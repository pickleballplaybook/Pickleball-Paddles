import Link from "next/link";
import { paddles } from "@/data/paddles";
import PaddleMiniCard from "@/components/PaddleMiniCard";

interface Props {
  excludeSlug?: string;
  title?: string;
  subtitle?: string;
}

const CUTOFF = "2025-04-01"; // exclude paddles older than ~18 months

export default function TrendingPaddlesSection({
  excludeSlug,
  title = "Trending Paddles Right Now",
  subtitle = "The most popular paddles in the catalog — sorted by demand, all with exclusive deals.",
}: Props) {
  const trending = paddles
    .filter(
      (p) =>
        p.slug !== excludeSlug &&
        p.image &&
        p.discountLink?.trim() &&
        (p.addedAt ?? "") >= CUTOFF
    )
    .sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0))
    .slice(0, 8);

  if (trending.length === 0) return null;

  return (
    <section className="py-14">
      <div className="container-xl">
        <div className="flex items-baseline justify-between gap-4 mb-2 flex-wrap">
          <h2 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <Link
            href="/paddles"
            className="text-sm font-semibold transition-colors hover:text-brand-400"
            style={{ color: "#5a9df9" }}
          >
            Browse all paddles →
          </Link>
        </div>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {trending.map((p) => (
            <PaddleMiniCard key={p.id} paddle={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
