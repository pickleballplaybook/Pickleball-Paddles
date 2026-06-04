import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { gearProducts } from "@/data/products";
import type { GearProduct } from "@/data/products";

interface Props {
  paddleId: string;   // used as the seed for deterministic gear rotation per paddle
}

/**
 * pickFeaturedGear
 * ----------------
 * Deterministic per-paddle gear selection, weighted heavily toward the
 * Titan Ball Machine (60% of paddles show Titan; the other 40% rotate
 * through the remaining gear). Same paddleId → same gear pick every load.
 */
function pickFeaturedGear(paddleId: string): GearProduct | undefined {
  const offset = parseInt(paddleId, 10) || 0;

  // Exclude the "academy" entry — it's a course product, not gear.
  const others = gearProducts.filter((g) => g.id !== "titan" && g.id !== "academy");
  const titan  = gearProducts.find((g) => g.id === "titan");

  // 60% Titan / 40% rotate through others. `offset % 5 < 3` → 3-of-5 = 60%.
  if (titan && offset % 5 < 3) return titan;
  if (others.length === 0) return titan ?? gearProducts[0];
  return others[Math.floor(offset / 5) % others.length];
}

/**
 * FeaturedGearPanel
 * -----------------
 * Replaces the old "duplicate price + buy" card in the paddle detail
 * sidebar. Shows one featured gear product per paddle (mostly the Titan
 * Ball Machine since it's the most-converting item). Selection is
 * deterministic per paddle.id so the user sees the same recommendation
 * every visit, not a random one each render.
 */
export default function FeaturedGearPanel({ paddleId }: Props) {
  const gear = pickFeaturedGear(paddleId);
  if (!gear) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
    >
      {/* Image header */}
      <Link href={`/gear/${gear.id}`} className="block group">
        <div
          className="relative aspect-square flex items-center justify-center p-6"
          style={{ background: gear.bg || "var(--flip-bg)" }}
        >
          {gear.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gear.image}
              alt={`${gear.brand} ${gear.name}`}
              className="max-h-[180px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          )}
          <span
            className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest"
            style={{ background: "rgba(20,184,166,0.95)", color: "#0a1628" }}
          >
            <Sparkles className="w-3 h-3" strokeWidth={3} />
            Recommended
          </span>
          {gear.badge && (
            <span
              className="absolute top-3 right-3 inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest"
              style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
            >
              {gear.badge}
            </span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#2dd4bf" }}>
          {gear.brand}
        </p>
        <Link href={`/gear/${gear.id}`} className="block group">
          <h3 className="text-lg font-extrabold leading-tight mb-2 group-hover:text-teal-400 transition-colors" style={{ color: "var(--flip-text-head)" }}>
            {gear.name}
          </h3>
        </Link>
        <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: "var(--flip-text-muted)" }}>
          {gear.subtitle}
        </p>

        {gear.price && (
          <p className="text-2xl font-extrabold mb-4" style={{ color: "var(--flip-text-head)" }}>
            {gear.price}
          </p>
        )}

        {/* Buy button — opens affiliate link in new tab */}
        <a
          href={gear.link}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center justify-center gap-2 w-full font-bold text-sm py-3 rounded-xl text-white mb-2 transition-all active:scale-[0.98]"
          style={{ background: "#14b8a6" }}
        >
          Buy at {gear.brand} <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Secondary: "Read review" link to /gear/[id] detail */}
        <Link
          href={`/gear/${gear.id}`}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold pt-1 transition-colors hover:text-teal-400"
          style={{ color: "var(--flip-text-muted)" }}
        >
          Read full review
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
