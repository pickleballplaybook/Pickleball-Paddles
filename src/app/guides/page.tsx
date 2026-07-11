import { Metadata } from "next";
import Link from "next/link";
import { guides, GUIDE_CATEGORIES, GuideCategoryKey } from "@/data/guides";
import { siteConfig } from "@/config/site";

const PAGE_TITLE = "Pickleball Paddle Guides — Plain-English Answers to Every Question";
const PAGE_DESCRIPTION =
  "Dedicated guides answering the questions players actually ask about pickleball paddles — thickness, shape, swing weight, materials, lifespan, lead tape, and more.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${siteConfig.siteUrl}/guides` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: `${siteConfig.siteUrl}/guides`,
    siteName: siteConfig.name,
  },
};

export default function GuidesHubPage() {
  // Group guides by category, in the order defined in GUIDE_CATEGORIES so the
  // hub layout stays stable as new guides are added at the end of guides.ts.
  const categoryOrder = Object.keys(GUIDE_CATEGORIES) as GuideCategoryKey[];
  const byCategory: Record<GuideCategoryKey, typeof guides> = {
    anatomy: [], buying: [], comparison: [], care: [], gear: [], player: [],
  };
  for (const g of guides) byCategory[g.category].push(g);

  return (
    <div className="min-h-screen pt-[156px] pb-20">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
            Pickleball Playbook
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3" style={{ color: "var(--flip-text-head)" }}>
            Pickleball Paddle Guides
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--flip-text-muted)" }}>
            Plain-English answers to the questions players actually ask. Pick a topic — or browse by category.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-12">
          {categoryOrder.map((key) => {
            const cat = GUIDE_CATEGORIES[key];
            const list = byCategory[key];
            if (list.length === 0) return null;
            return (
              <section key={key}>
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="text-2xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
                    {cat.label}
                  </h2>
                  <span className="text-xs font-bold" style={{ color: "var(--flip-text-muted)" }}>
                    {list.length} guide{list.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="text-base mb-5" style={{ color: "var(--flip-text-muted)" }}>
                  {cat.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {list.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/guides/${g.slug}`}
                      className="block p-5 rounded-2xl transition hover:scale-[1.01]"
                      style={{
                        background: "var(--flip-bg-card)",
                        border: "1px solid var(--flip-card-border)",
                      }}
                    >
                      <p className="font-bold text-base leading-tight mb-2" style={{ color: "var(--flip-text-head)" }}>
                        {g.title}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-muted)" }}>
                        {g.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
