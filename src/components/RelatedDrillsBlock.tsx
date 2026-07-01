import Link from "next/link";
import { Zap } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";

// ─────────────────────────────────────────────────────────────────────────────
//  RelatedDrillsBlock
//  Renders a card grid linking to drill/training guide blog posts. Mirrors
//  RelatedGuidesBlock but pulls from blogPosts.ts (category === "guide")
//  instead of guides.ts. Drop on paddle pages, category pages, the gear hub
//  — anywhere we want to funnel commercial-intent traffic into informational
//  pages and signal topical authority to Google.
//
//  The SEO point: every paddle page gets a card-grid of 4-6 contextually
//  relevant drill/training links, with natural anchor text from each post's
//  title. Across 180+ paddle pages that's ~1000+ inbound contextual links
//  pointing at the new guide content.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Blog post slugs (must be category === "guide"). Missing slugs skipped. */
  slugs: string[];
  /** Card-grid title. Default: "Train Smarter, Hit Harder". */
  title?: string;
  /** Optional small eyebrow text above the title. */
  eyebrow?: string;
}

export default function RelatedDrillsBlock({
  slugs,
  title = "Train Smarter, Hit Harder",
  eyebrow = "Drills · Training · Tips",
}: Props) {
  const posts = slugs
    .map((slug) => blogPosts.find((p) => p.slug === slug && p.category === "guide"))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (posts.length === 0) return null;

  return (
    <section className="mt-12 max-w-5xl mx-auto">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#defa32" }}>
          {eyebrow}
        </p>
      )}
      <div className="flex items-center gap-2.5 mb-6">
        <Zap className="w-5 h-5" style={{ color: "#defa32" }} />
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="block p-5 rounded-2xl transition hover:scale-[1.01]"
            style={{
              background: "var(--bg-card, rgba(255,255,255,0.04))",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: "#3cacae" }}>
              {p.guideTag ?? "Pickleball Guide"}
            </p>
            <p className="font-bold text-base leading-snug mb-1.5" style={{ color: "var(--text-primary)" }}>
              {p.title}
            </p>
            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
              {p.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Helper: pick a contextually-relevant set of 4 drill posts based on
// paddle attributes. Power players see drives/training; control players see
// dinks/resets/drops. Falls back to evergreens so every paddle gets links.
export function drillsForPaddle(input: {
  playStyle?: string;
  shape?: string;
}): string[] {
  const playStyle = (input.playStyle || "").toLowerCase();
  const shape = (input.shape || "").toLowerCase();
  const picks: string[] = [];

  if (playStyle.includes("power") || shape.includes("elongated")) {
    picks.push("pickleball-third-shot-drop", "pickleball-training-plan");
  } else if (playStyle.includes("control") || shape.includes("widebody")) {
    picks.push("best-pickleball-drills", "how-to-practice-pickleball-alone");
  } else {
    // "all-court" / "spin" / hybrid / unknown — surface the universally
    // applicable posts.
    picks.push("best-pickleball-drills", "pickleball-third-shot-drop");
  }

  // Always include a beginner-friendly entry point + the training-tools
  // post (which features the ball machine, complementary to paddles).
  picks.push("how-to-get-better-at-pickleball");
  picks.push("best-pickleball-training-tools");

  return Array.from(new Set(picks)).slice(0, 4);
}
