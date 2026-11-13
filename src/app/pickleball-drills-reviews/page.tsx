import type { Metadata } from "next";
import { Star, Download, Apple } from "lucide-react";

export const revalidate = 86400;

const APP_ID = "6445845357";
const DOWNLOAD_URL = "https://pbdrills.com";
const STORE_URL = "https://apps.apple.com/us/app/pickleball-drills/id6445845357";

interface AppReview {
  id: string;
  author: string;
  title: string;
  body: string;
  date: string;
}

async function fetchFiveStarReviews(): Promise<AppReview[]> {
  const allReviews: AppReview[] = [];

  for (let page = 1; page <= 10; page++) {
    try {
      const res = await fetch(
        `https://itunes.apple.com/rss/customerreviews/page=${page}/id=${APP_ID}/sortBy=mostRecent/json`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) break;
      const data = await res.json();
      const entries = data?.feed?.entry;
      if (!Array.isArray(entries) || entries.length === 0) break;

      for (const entry of entries) {
        // Skip the app-info entry (no im:rating) and non-5-star reviews
        if (!entry["im:rating"]) continue;
        const rating = parseInt(entry["im:rating"]?.label ?? "0", 10);
        if (rating !== 5) continue;

        const rawDate: string = entry.updated?.label ?? "";
        const formattedDate = rawDate
          ? new Date(rawDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : "";

        allReviews.push({
          id: entry.id?.label ?? `${page}-${allReviews.length}`,
          author: entry.author?.name?.label ?? "App Store User",
          title: entry.title?.label ?? "",
          body: entry.content?.label ?? "",
          date: formattedDate,
        });
      }
    } catch {
      break;
    }
  }

  return allReviews;
}

export const metadata: Metadata = {
  title: "Pickleball Drills App Reviews — What Players Are Saying",
  description:
    "Real 5-star App Store reviews for the Pickleball Drills app. See what players of all levels say about drilling, improving, and leveling up their game.",
  alternates: { canonical: "https://playbookpaddles.com/pickleball-drills-reviews" },
  openGraph: {
    title: "Pickleball Drills App Reviews — What Players Are Saying",
    description:
      "Real 5-star reviews from pickleball players who improved their game with the Pickleball Drills app.",
    url: "https://playbookpaddles.com/pickleball-drills-reviews",
    type: "website",
  },
};

export default async function DrillsReviewsPage() {
  const reviews = await fetchFiveStarReviews();

  return (
    <div className="min-h-screen pt-[156px] pb-24" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-16">

        {/* Hero */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full mb-6"
            style={{ background: "rgba(90,157,249,0.12)", border: "1px solid rgba(90,157,249,0.3)" }}
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" style={{ color: "#f59e0b" }} />
            ))}
            <span className="text-sm font-bold ml-1" style={{ color: "#5a9df9" }}>
              Thousands of 5-Star Reviews
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            What Players Are Saying
          </h1>
          <p className="text-xl mb-8" style={{ color: "var(--text-muted)" }}>
            Real reviews from the Pickleball Drills app — from beginners to 5.0 players who drilled their way to a better game.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold text-base px-8 py-4 rounded-2xl transition-all hover:scale-[1.03] hover:brightness-110"
              style={{ background: "#5a9df9", color: "#ffffff" }}
            >
              <Download className="w-5 h-5" />
              Download Free
            </a>
            <a
              href={STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-4 rounded-2xl transition-all hover:scale-[1.02]"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-muted)" }}
            >
              <Apple className="w-4 h-4" />
              View on App Store
            </a>
          </div>
        </div>

        {/* Reviews masonry grid */}
        {reviews.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="break-inside-avoid mb-5 rounded-2xl p-5"
                style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: "#f59e0b" }} />
                  ))}
                </div>

                {/* Title */}
                {review.title && (
                  <h3 className="font-extrabold text-sm mb-2" style={{ color: "var(--text-primary)" }}>
                    {review.title}
                  </h3>
                )}

                {/* Body */}
                {review.body && review.body !== review.title && (
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
                    {review.body}
                  </p>
                )}

                {/* Author + date */}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.pravatar.cc/40?u=${encodeURIComponent(review.author)}`}
                      alt={review.author}
                      width={28}
                      height={28}
                      className="rounded-full object-cover flex-shrink-0"
                      style={{ width: 28, height: 28 }}
                    />
                    <span className="text-xs font-bold" style={{ color: "var(--text-primary)", opacity: 0.55 }}>
                      {review.author}
                    </span>
                  </div>
                  {review.date && (
                    <span className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                      {review.date}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p style={{ color: "var(--text-muted)" }}>Reviews are loading. Check back shortly.</p>
          </div>
        )}

        {/* Bottom CTA */}
        <div
          className="mt-20 text-center rounded-3xl p-10 md:p-16"
          style={{ background: "rgba(90,157,249,0.08)", border: "1px solid rgba(90,157,249,0.2)" }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" style={{ color: "#f59e0b" }} />
            ))}
          </div>
          <h2
            className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Ready to Transform Your Game?
          </h2>
          <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
            Join thousands of players improving with structured, pro-built drills. Start free — cancel anytime.
          </p>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-bold text-base px-10 py-4 rounded-2xl transition-all hover:scale-[1.03] hover:brightness-110"
            style={{ background: "#5a9df9", color: "#ffffff" }}
          >
            <Download className="w-5 h-5" />
            Download Pickleball Drills — Free
          </a>
        </div>

      </div>
    </div>
  );
}
