import { gearProducts } from "@/data/products";

type ProductLite = {
  id: string;
  brand: string;
  name: string;
  price: string;
  badge?: string;
  link: string;
  image: string;
  subtitle: string;
  bg: string;
  ctaText: string;
};

/**
 * Product card inline in newsletter posts. Reads from `gearProducts`
 * (same source of truth as /gear). Rotates deterministically per post
 * so every post gets a different product — hashes the post slug into
 * an index. That keeps things fresh across the archive without a random
 * mount that would re-shuffle on every render.
 *
 * Layout matches the small "sponsored gear" cards The Dink runs in
 * their articles. Includes the "80% off" style badge where applicable
 * so the discount pops.
 */
function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickProductForPost(slug: string, offset = 0): ProductLite {
  const idx = (hashSlug(slug) + offset) % gearProducts.length;
  return gearProducts[idx] as unknown as ProductLite;
}

export function PlaybookProductCard({
  slug,
  offset = 0,
}: {
  slug: string;
  offset?: number;
}) {
  const product = pickProductForPost(slug, offset);
  return (
    <aside
      className="my-10 not-prose"
      style={{
        background: product.bg,
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid var(--flip-card-border)",
      }}
    >
      <a
        href={product.link}
        target="_blank"
        rel="noopener sponsored"
        className="flex flex-col md:flex-row items-stretch no-underline"
        style={{ color: "#FFFFFF" }}
      >
        <div
          className="relative shrink-0"
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            maxWidth: 220,
            background: "rgba(255,255,255,0.05)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={`${product.brand} ${product.name}`}
            className="absolute inset-0 w-full h-full object-contain p-4"
          />
        </div>
        <div className="p-5 md:p-6 flex-1 flex flex-col justify-center">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Gear Austin uses
          </p>
          <p
            className="text-xl md:text-2xl font-extrabold mb-1 leading-tight"
            style={{ color: "#FFFFFF" }}
          >
            {product.brand} {product.name}
          </p>
          <p
            className="text-sm mb-4"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            {product.subtitle}
          </p>
          <div className="flex items-center flex-wrap gap-2">
            <span
              className="inline-block px-3 py-1.5 rounded-lg text-sm font-bold"
              style={{ background: "#FFFFFF", color: "#0A0A0F" }}
            >
              {product.ctaText}
            </span>
            {product.badge && (
              <span
                className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide"
                style={{
                  background: "#DEFA32",
                  color: "#0A0A0F",
                }}
              >
                {product.badge}
              </span>
            )}
          </div>
        </div>
      </a>
    </aside>
  );
}
