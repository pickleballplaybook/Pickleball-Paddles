import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target, Zap, Trophy, Users } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";
import { siteConfig } from "@/config/site";

// Topical pillar page for the keyword "pickleball drills". The strategy is
// "hub and spoke": this page targets the main keyword, ranks for it, and
// internally links to every individual guide post. Google interprets this
// pattern as topical authority and ranks all the linked pages higher.
//
// SEO goals for this page specifically:
//   - Rank #1 for "pickleball drills" (US search volume ~22k/month)
//   - Also rank for: pickleball drills for beginners, pickleball drills solo,
//     pickleball drills at home, pickleball drills for intermediate players
//   - Funnel readers into the 10 deep-dive guide posts (the spokes)
//   - Push readers into a Pickleball Drills app trial signup

const PBDRILLS_URL = "https://pbdrills.com";
const CHARTREUSE = "#defa32";
const TEAL = "#3cacae";
const NAVY = "#0a1628";

const SPOKE_POSTS = [
  "best-pickleball-drills",
  "pickleball-drills-for-beginners",
  "how-to-practice-pickleball-alone",
  "pickleball-wall-drills",
  "pickleball-third-shot-drop",
  "pickleball-dink-strategy",
  "pickleball-tips",
  "how-to-get-better-at-pickleball",
  "pickleball-training-plan",
  "best-pickleball-training-tools",
  "best-pickleball-ball-machine",
];

export const metadata: Metadata = {
  title: "Pickleball Drills: The Complete Guide (200+ Drills by Tour Pros)",
  description:
    "The complete pickleball drills hub — 200+ drills for every shot, level, and time available. Dink, drop, drive, volley, reset, serve, wall, ball machine. Built by APP & PPA tour pros.",
  alternates: { canonical: `${siteConfig.siteUrl}/pickleball-drills` },
  openGraph: {
    title: "Pickleball Drills: The Complete Guide",
    description: "200+ pickleball drills built by tour pros — dinks, drops, drives, resets, wall and solo drills, with structured progressions for every level.",
    url: `${siteConfig.siteUrl}/pickleball-drills`,
    type: "article",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pickleball Drills: The Complete Guide",
    description: "200+ pickleball drills built by tour pros for every shot, level, and time available.",
  },
};

const PILLAR_FAQS: { q: string; a: string }[] = [
  {
    q: "What are the best pickleball drills?",
    a: "The three most impactful drills for any rec player: cross-court dinking (10 min), baseline third-shot drops (10 min), deep return targets (5 min). Those three drills, run weekly, move ratings faster than any other combination. See our full Best Pickleball Drills guide for 17 more drills sorted by shot.",
  },
  {
    q: "How often should I do pickleball drills?",
    a: "90 minutes of focused drilling per week is the floor for measurable improvement. That's three 30-minute sessions or four 20-minute sessions. Less than 60 minutes a week and rec players plateau.",
  },
  {
    q: "Can I do pickleball drills alone?",
    a: "Yes — about half of effective drilling can happen solo. Wall drills, shadow drills, and ball machine routines don't need a partner. See our How to Practice Pickleball Alone guide for 14 solo drill options.",
  },
  {
    q: "What pickleball drills should beginners start with?",
    a: "Beginners should drill three shots first: cross-court dinks, baseline third-shot drops, and deep returns. Those three shots represent 70% of points won at the 3.0-3.5 level. Master them before adding anything else.",
  },
  {
    q: "How long do pickleball drills take to improve your game?",
    a: "Measurable improvement on a single shot takes 10-14 days of focused drilling. Rating-level improvement takes 60-90 days of consistent training. The Pickleball Drills app's beginner-to-advanced tracks codify this progression.",
  },
  {
    q: "What's the most important pickleball drill?",
    a: "The third-shot drop. Every rally above the 3.0 level lives or dies on this shot, and it's the one rec players most often skip drilling. Run baseline drops to a 4-foot kitchen target until you can land 10 in a row — three times a week, for 60 days.",
  },
];

function spokePost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}

export default function PickleballDrillsPillarPage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Pickleball Drills: The Complete Guide",
    description: metadata.description,
    datePublished: "2026-06-24",
    dateModified: "2026-06-24",
    author: { "@type": "Person", name: "Austin Hardy", url: siteConfig.siteUrl },
    publisher: {
      "@type": "Organization",
      name: "Pickleball Playbook",
      url: siteConfig.siteUrl,
      logo: { "@type": "ImageObject", url: `${siteConfig.siteUrl}/images/Logo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteConfig.siteUrl}/pickleball-drills` },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PILLAR_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const categories = [
    { name: "Dink", desc: "Soft hands, kitchen-line control, NVZ patience.", icon: Target },
    { name: "Drive", desc: "Pace, shape, and finishing from the baseline.", icon: Zap },
    { name: "Drop", desc: "The most important shot in pickleball.", icon: Trophy },
    { name: "Volley", desc: "Punch volleys, hand speed, net pressure.", icon: Users },
    { name: "Reset", desc: "Take pace off. Take the court back.", icon: Target },
    { name: "Serve", desc: "Placement, spin, high-percentage targets.", icon: Zap },
    { name: "Wall", desc: "Drills you can run anywhere, no partner.", icon: Trophy },
    { name: "Ball Machine", desc: "Solo programmed routines with app integration.", icon: Users },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <main className="min-h-screen" style={{ background: NAVY, color: "#fff", paddingTop: "calc(var(--topbar-h, 108px) + 2rem)" }}>
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(60,172,174,0.18) 0%, transparent 65%), ${NAVY}`,
            paddingBottom: "5rem",
          }}
        >
          <div className="container-xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] mb-4" style={{ color: CHARTREUSE }}>
              The Complete Guide · Updated June 2026
            </p>
            <h1
              className="font-extrabold tracking-tight leading-[0.95] mb-6 max-w-5xl"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              Pickleball Drills:{" "}
              <span style={{ color: CHARTREUSE }}>Every Shot, Every Level, in One Place.</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed mb-7 max-w-3xl" style={{ color: "rgba(255,255,255,0.78)" }}>
              200+ pickleball drills built by APP &amp; PPA tour pros, sorted by shot, level,
              and time available. From cross-court dink rallies to ball-machine
              programmed routines — this is the only pickleball drill hub you
              need.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a
                href={PBDRILLS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-extrabold text-base px-8 py-4 rounded-2xl tracking-wide transition-transform hover:scale-[1.02]"
                style={{
                  background: CHARTREUSE,
                  color: NAVY,
                  boxShadow: "0 0 48px rgba(222,250,50,0.45)",
                  letterSpacing: "0.02em",
                }}
              >
                Start Free 7-Day Trial →
              </a>
              <Link
                href="/blog/best-pickleball-drills"
                className="inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-4 rounded-2xl transition-transform hover:scale-[1.01]"
                style={{
                  background: "transparent",
                  color: TEAL,
                  border: `2px solid ${TEAL}`,
                }}
              >
                Read the 20 Best Drills
              </Link>
            </div>
            <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              ★★★★★ Trusted by 1,000+ serious players · Built by an PPR-certified
              coach
            </p>
          </div>
        </section>

        {/* TL;DR */}
        <section className="py-12" style={{ background: "rgba(0,0,0,0.30)" }}>
          <div className="container-xl max-w-4xl mx-auto">
            <div
              className="rounded-2xl p-7"
              style={{ background: "rgba(222,250,50,0.06)", border: `1px solid ${CHARTREUSE}` }}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] mb-3" style={{ color: CHARTREUSE }}>
                The TL;DR
              </p>
              <p className="text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.92)" }}>
                If you only have 20 minutes a week to drill pickleball, run these three:{" "}
                <strong>cross-court dinking</strong> (10 min),{" "}
                <strong>baseline third-shot drops</strong> (10 min),{" "}
                <strong>deep return targets</strong> (5 min). Those three drills
                move ratings faster than any other combination, at every level
                from 3.0 to 4.5. The 200+ drills below build on that foundation.
              </p>
            </div>
          </div>
        </section>

        {/* 8 categories */}
        <section className="py-16 md:py-20">
          <div className="container-xl">
            <div className="text-center mb-12">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] mb-3" style={{ color: TEAL }}>
                The 8 Drill Categories
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                Every shot in pickleball, drilled.
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
                Each category has structured progressions from beginner to advanced,
                with partner, solo, wall, and ball-machine variations.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
              {categories.map((c) => (
                <div
                  key={c.name}
                  className="rounded-2xl p-5 md:p-6 transition-transform hover:-translate-y-1"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <c.icon className="w-5 h-5 mb-3" style={{ color: CHARTREUSE }} />
                  <h3 className="text-lg md:text-xl font-extrabold mb-2">{c.name}</h3>
                  <p className="text-[13px] md:text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {c.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Hub — Spoke posts */}
        <section className="py-16 md:py-20" style={{ background: "rgba(0,0,0,0.30)" }}>
          <div className="container-xl">
            <div className="text-center mb-12">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] mb-3" style={{ color: CHARTREUSE }}>
                Deep Dives
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                The complete drill library, one click away.
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
                Every category, every level, every common search query — covered.
                Pick where you&apos;re stuck and start drilling tonight.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {SPOKE_POSTS.map((slug) => {
                const post = spokePost(slug);
                if (!post) return null;
                return (
                  <Link
                    key={slug}
                    href={`/blog/${slug}`}
                    className="block rounded-2xl p-6 transition-transform hover:-translate-y-1"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}
                  >
                    <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: TEAL }}>
                      {post.guideTag ?? "Guide"}
                    </p>
                    <h3 className="text-lg md:text-xl font-extrabold leading-tight mb-2">
                      {post.title}
                    </h3>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {post.excerpt}
                    </p>
                    <p className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: CHARTREUSE }}>
                      Read the guide <ArrowRight className="w-3 h-3" />
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* What makes a good drill */}
        <section className="py-16 md:py-20">
          <div className="container-xl max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
              What separates a good pickleball drill from a wasted session?
            </h2>
            <p className="text-base md:text-lg leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.78)" }}>
              Most rec players think they&apos;re drilling. They&apos;re actually
              just hitting balls. A real pickleball drill has four properties: a
              specific shot being trained, a measurable target, a clear progression,
              and enough reps to install muscle memory (~100+ per shot, per session).
            </p>
            <p className="text-base md:text-lg leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.78)" }}>
              The 200+ drills in our drill hub — and the structured progressions
              inside the{" "}
              <a href={PBDRILLS_URL} target="_blank" rel="noopener noreferrer" style={{ color: CHARTREUSE, textDecoration: "underline" }}>
                Pickleball Drills app
              </a>{" "}
              — are built around this structure. Pick a drill, run it with the
              specified target and rep count, advance when consistency hits the
              benchmark. That&apos;s the system.
            </p>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
              Below: the FAQ section answers the most common pickleball drill
              questions. Above: every deep-dive guide. Across: the app itself,
              which packages all of this into a phone-sized drilling system you
              can run before, during, or instead of a court session.
            </p>
          </div>
        </section>

        {/* App CTA */}
        <section className="py-16 md:py-20" style={{ background: "rgba(0,0,0,0.30)" }}>
          <div className="container-xl max-w-3xl mx-auto text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] mb-3" style={{ color: CHARTREUSE }}>
              The Drill Hub In Your Pocket
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
              200+ drills, sorted, demoed, ready to run.
            </h2>
            <p className="text-lg mb-7" style={{ color: "rgba(255,255,255,0.75)" }}>
              Plans from $19/mo. 7-day free trial of the full library. Cancel anytime in two taps.
            </p>
            <a
              href={PBDRILLS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 font-extrabold text-base px-10 py-5 rounded-2xl tracking-wide transition-transform hover:scale-[1.02]"
              style={{
                background: CHARTREUSE,
                color: NAVY,
                boxShadow: "0 0 64px rgba(222,250,50,0.45)",
              }}
            >
              Start Free 7-Day Trial →
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20">
          <div className="container-xl max-w-3xl mx-auto">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] mb-3" style={{ color: TEAL }}>
              FAQ
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-8">
              Pickleball drills, answered.
            </h2>
            <div className="space-y-3">
              {PILLAR_FAQS.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <summary className="cursor-pointer list-none px-6 py-5 flex items-start justify-between gap-4">
                    <span className="text-base md:text-lg font-bold">{f.q}</span>
                    <span
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-transform group-open:rotate-45 text-lg font-bold"
                      style={{ background: "rgba(222,250,50,0.12)", color: CHARTREUSE, border: `1px solid ${CHARTREUSE}` }}
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-6 pb-5 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
