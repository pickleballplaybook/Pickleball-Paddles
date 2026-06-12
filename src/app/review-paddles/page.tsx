import { paddles } from "@/data/paddles";
import ReviewPaddleGrid from "./ReviewPaddleGrid";

export const metadata = {
  title: "Save Paddles to Your Shortlist",
  description: "Build your personal paddle shortlist. Save paddles you're interested in, skip the ones that aren't for you.",
};

export default function ReviewPaddlesPage() {
  const paddleList = paddles.map((p) => ({
    id: p.id,
    slug: p.slug,
    brand: p.brand,
    name: p.name,
    image: p.image ?? null,
  }));

  return (
    <div
      className="min-h-screen pt-[156px]"
      style={{ background: "var(--bg-page)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">
            Your Shortlist
          </p>
          <h1
            className="text-3xl font-extrabold tracking-tight mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Build Your Paddle Shortlist
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Tap the bookmark on paddles you&apos;re interested in to save them to your shortlist.
            Thumbs-down the ones that aren&apos;t for you. View your saved paddles anytime on the Saved page.
          </p>
        </div>

        <ReviewPaddleGrid paddles={paddleList} />
      </div>
    </div>
  );
}
