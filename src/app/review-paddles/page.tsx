import { paddles } from "@/data/paddles";
import ReviewPaddleGrid from "./ReviewPaddleGrid";

export const metadata = {
  title: "Review Paddles",
  description: "Share your paddle feedback and help shape what's trending.",
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
            Community
          </p>
          <h1
            className="text-3xl font-extrabold tracking-tight mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Review Paddles
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Heart the paddles you love. Thumbs-down the ones that weren&apos;t for you.
            Your feedback shapes what&apos;s trending.
          </p>
        </div>

        <ReviewPaddleGrid paddles={paddleList} />
      </div>
    </div>
  );
}
