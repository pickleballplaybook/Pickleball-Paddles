import Link from "next/link";
import { getGuideBySlug, GUIDE_CATEGORIES } from "@/data/guides";
import { BookOpen } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  RelatedGuidesBlock
//  Renders a card grid of /guides/<slug> links for a list of guide slugs.
//  Drop this anywhere on the site that should funnel readers into the
//  informational pages — best-paddles category pages, paddle detail pages,
//  blog posts. Missing slugs are silently skipped so a guide can be renamed
//  or removed without breaking unrelated pages.
//
//  The internal links here are the SEO point of this component. Every
//  inbound contextual link from a high-authority page tells Google those
//  guides are topically connected, which helps the guides themselves rank.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Guide slugs to surface (filtered to ones that actually exist). */
  slugs: string[];
  /** Optional title — defaults to "Related Guides". Use to set context. */
  title?: string;
  /** Optional eyebrow text above the title. */
  eyebrow?: string;
}

export default function RelatedGuidesBlock({
  slugs,
  title = "Related Guides",
  eyebrow,
}: Props) {
  const guides = slugs
    .map((s) => getGuideBySlug(s))
    .filter((g): g is NonNullable<ReturnType<typeof getGuideBySlug>> => Boolean(g));

  if (guides.length === 0) return null;

  return (
    <section className="mt-20 max-w-5xl mx-auto">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#14b8a6" }}>
          {eyebrow}
        </p>
      )}
      <div className="flex items-center gap-2.5 mb-6">
        <BookOpen className="w-5 h-5" style={{ color: "#2dd4bf" }} />
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {guides.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="block p-5 rounded-2xl transition hover:scale-[1.01]"
            style={{
              background: "var(--bg-card, rgba(255,255,255,0.04))",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: "rgba(45,212,191,0.9)" }}>
              {GUIDE_CATEGORIES[g.category].label}
            </p>
            <p className="font-bold text-base leading-snug mb-1.5" style={{ color: "var(--text-primary)" }}>
              {g.title}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {g.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
