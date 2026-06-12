import { paddles } from "@/data/paddles";
import ReviewPaddleGrid from "./ReviewPaddleGrid";

export const metadata = {
  title: "Rate Pickleball Paddles",
  description: "Vote on the paddles you've tried. Thumbs up the ones you'd recommend, thumbs down the ones you wouldn't. Your votes shape the trending rankings.",
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
            Community Votes
          </p>
          <h1
            className="text-3xl font-extrabold tracking-tight mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Rate Paddles You&apos;ve Tried
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Thumbs up the paddles you&apos;d recommend, thumbs down the ones you wouldn&apos;t.
            Your votes feed directly into the trending rankings — one vote per paddle per browser.
          </p>
        </div>

        <ReviewPaddleGrid paddles={paddleList} />
      </div>
    </div>
  );
}
