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
 * Deterministic per-paddle gear selection. Weighted heavily toward the two
 * highest-value affiliate products: Titan Ball Machine and the Joola R4LLY
 * court shoe. Same paddleId → same gear pick every load.
 *
 * Distribution (out of every 20 paddles):
 *   • 7  → Titan Ball Machine    (35%)
 *   • 7  → Joola R4LLY shoe      (35%)
 *   • 6  → rotate through others (30%)
 */
function pickFeaturedGear(paddleId: string): GearProduct | undefined {
  const offset = parseInt(paddleId, 10) || 0;

  // Exclude "academy" (course product, not gear) plus the two priority items.
  const others = gearProducts.filter(
    (g) => g.id !== "titan" && g.id !== "r4lly" && g.id !== "academy",
  );
  const titan = gearProducts.find((g) => g.id === "titan");
  const r4lly = gearProducts.find((g) => g.id === "r4lly");

  const bucket = offset % 20;
  if (bucket < 7 && titan) return titan;
  if (bucket < 14 && r4lly) return r4lly;
  if (others.length === 0) return titan ?? r4lly ?? gearProducts[0];
  return others[Math.floor(offset / 20) % others.length];
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
      {/* Image header — image fills the card (was previously sized way too small) */}
      <Link href={`/gear/${gear.id}`} className="block group">
        <div
          className="relative aspect-square flex items-center justify-center p-2"
          style={{ background: gear.bg || "var(--flip-bg)" }}
        >
          {gear.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gear.image}
              alt={`${gear.brand} ${gear.name}`}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
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
          className="flex items-center justify-center gap-2 w-full font-bold text-sm py-3 rounded-xl mb-2 transition-all active:scale-[0.98]"
          style={{ background: "var(--btn-buy-bg)", color: "var(--btn-buy-text)" }}
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
