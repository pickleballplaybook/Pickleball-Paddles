import type { Metadata } from "next";
import AppPreviewClient from "./_components/AppPreview";
import LandingViewBeacon from "./_components/LandingViewBeacon";

// Every CTA on this page routes through PBDRILLS. The ?ref tag is
// captured by the Flutter app on cold boot and stamped onto the
// signup Firestore/Supabase writes so /admin/email?view=landing can
// attribute conversions back to this page.
const PBDRILLS = "https://pbdrills.com?ref=pbdrills-landing";

// Brand colors (Pickleball Drills app)
const CHARTREUSE = "#defa32";
const TEAL = "#3cacae";

// ─── Quick-edit knobs ────────────────────────────────────────────────────────
// Prices are intentionally NOT on this page. The landing page's job is to get
// the user into the app onboarding, where they get their personalized plan
// first and see pricing in context. Pricing debates belong post-value.

// Drop in an MP4 (in /public) or a YouTube/Vimeo embed URL. When set, the
// AppPreview section renders below the hero. Empty = section hidden.
const DEMO_VIDEO: { src: string; type: "mp4" | "embed" } | null = {
  src: "/videos/pbdrills-demo.mp4",
  type: "mp4",
};

// Real testimonials only. App Store reviews are public and quote-able with
// attribution; quotes trimmed lightly with ellipses for cards, no wording changed.
const TESTIMONIALS: { quote: string; name: string; stars?: number; source?: string; image?: string }[] = [
  {
    quote: "The Pickleball drill app is a must have for beginners and pros alike. My drops dinks and drives have improved drastically. Within the week, my friends were all asking what I was doing to get better.",
    name: "BigApeCiervo",
    stars: 5,
    source: "App Store · Mar 2025",
  },
  {
    quote: "This app is effective for planning drill sessions… I have been implementing three sessions per week, and my performance has significantly improved.",
    name: "gbpickleball",
    stars: 5,
    source: "App Store · Mar 2025",
  },
  {
    quote: "The App is fantastic. I use it all the time for wall drills and machine drills. With this App you are never running out of good drill ideas. No more boring warmups with just dinking back and forth.",
    name: "Sissy Picklestar",
    stars: 5,
    source: "App Store · Aug 2025",
  },
  {
    quote: "Very well made and easy to understand drills for all levels. This app takes the thinking out of drilling. I would rate this higher than 5 stars if it were possible.",
    name: "cap10pete",
    stars: 5,
    source: "App Store · Feb 2025",
  },
];

export const metadata: Metadata = {
  title: "Pickleball Drills App — Train Like the Pros",
  description:
    "Stop guessing what to practice. Hundreds of drills built by APP & PPA pros — every shot, every level, in your pocket. Try it free. Cancel anytime.",
  alternates: { canonical: "https://playbookpaddles.com/pbdrills" },
  openGraph: {
    title: "Pickleball Drills App — Train Like the Pros",
    description:
      "The drill library used by 5.0+ players and coaches. Free trial, cancel anytime.",
    url: "https://playbookpaddles.com/pbdrills",
    type: "website",
  },
};

export default function PbDrillsLandingPage() {
  return (
    <main
      className="min-h-screen pb-0"
      style={{
        background: "#0a1628",
        color: "#ffffff",
      }}
    >
      <LandingViewBeacon page="pbdrills" />
      <Hero />
      <AppPreview />
      <PressStrip />
      <PainPoints />
      <ZeroRisk />
      <ProvenStat />
      <Library />
      <Technique />
      <Coaches />
      <Testimonials />
      <HowItWorks />
      <FAQ />
      <FinalCTA />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Hero — eyebrow + giant headline + value bullets + DrillFinder on the right
// ─────────────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(60,172,174,0.18) 0%, transparent 65%), #0a1628",
        // Top padding has to clear BOTH the sticky navbar AND the
        // promo banner ("Rate Paddles You've Tried") that sits above
        // it. --topbar-h is dynamically measured but there's a
        // hydration window where the fallback of 108px was too short
        // and clipped the eyebrow badge under the promo bar. 5rem of
        // extra headroom guarantees the eyebrow is visible even when
        // both bars are showing.
        paddingTop: "calc(var(--topbar-h, 108px) + 5rem)",
        paddingBottom: "3.5rem",
      }}
    >
      <div className="container-xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-14 items-center">
          {/* Left — copy */}
          <div>
            <span
              className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] px-3 py-1.5 rounded-full mb-4"
              style={{
                background: "rgba(222,250,50,0.10)",
                color: CHARTREUSE,
                border: "1px solid rgba(222,250,50,0.35)",
              }}
            >
              <span aria-hidden>✓</span> Free Trial · Cancel Anytime
            </span>

            <h1
              className="font-extrabold tracking-tight leading-[0.95] mb-4 text-white"
              style={{ fontSize: "clamp(2.3rem, 5.2vw, 4rem)" }}
            >
              Stop guessing what to practice.{" "}
              <span style={{ color: CHARTREUSE }}>Drill like a pro.</span>
            </h1>

            <p
              className="text-base md:text-lg leading-snug mb-5"
              style={{ color: "rgba(255,255,255,0.75)", maxWidth: "32em" }}
            >
              The drill library that APP &amp; PPA pros built for the rest of us —
              every shot, every level, with the technique and strategy you&apos;d
              only get from a $200 lesson.
            </p>

            {/* Value bullets — tightened spacing to keep the primary CTA
                above the fold on laptop heights. */}
            <ul className="space-y-1.5 mb-6 text-[15px]">
              {[
                "Hundreds of drills sorted by shot, level, and time available",
                "Step-by-step technique breakdowns from real pros",
                "A drilling plan even if you don't have a partner",
                "Built for phone — pull it up on the bench, hit the court",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(222,250,50,0.16)",
                      border: `1px solid ${CHARTREUSE}`,
                      color: CHARTREUSE,
                      fontSize: "11px",
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.92)" }}>{line}</span>
                </li>
              ))}
            </ul>

            {/* CTAs — one primary action. Secondary is a text link, not a
                competing button, so the eye lands on the primary CTA. The
                trial doesn't start on click — clicking takes them to the
                app's onboarding flow (personalized plan → paywall → trial).
                Button copy reflects that. */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 mb-5">
              <a
                href={PBDRILLS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-extrabold text-base px-8 py-4 rounded-2xl tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: CHARTREUSE,
                  color: "#0a1628",
                  boxShadow: "0 0 48px rgba(222,250,50,0.45), 0 6px 24px rgba(0,0,0,0.35)",
                  letterSpacing: "0.02em",
                }}
              >
                SIGN UP NOW — START FREE →
              </a>
              {DEMO_VIDEO && (
                <a
                  href="#app-preview"
                  className="inline-flex items-center justify-center gap-1 text-sm font-bold transition-opacity hover:opacity-80 underline underline-offset-4"
                  style={{ color: TEAL }}
                >
                  See it in action ↓
                </a>
              )}
            </div>

            {/* Mini trust line */}
            <p className="text-[13px] flex items-center flex-wrap gap-x-2 gap-y-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span aria-hidden>★★★★★</span>
              <span>Trusted by 1,000+ serious pickleball players</span>
              <span aria-hidden>·</span>
              <span>Cancel anytime</span>
            </p>
          </div>

          {/* Right — Jack Munro trust anchor. The whole "drills built by
              real pros" pitch lives or dies on WHO the coaches are, and
              Munro (APP World #1) is the strongest name we have. Big
              photo card, credential badges, a secondary line naming the
              other PPA pros so it doesn't read as a one-man app.
              Hidden below lg to keep mobile clean. */}
          <div className="hidden lg:flex flex-col items-center">
            <p
              className="text-[10px] font-extrabold uppercase tracking-[0.22em] mb-4"
              style={{ color: TEAL }}
            >
              Drills Built By
            </p>
            <div
              className="relative rounded-3xl overflow-hidden w-full max-w-md"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 30px 80px -20px rgba(60,172,174,0.35)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/pbdrills-coaches/Jack-Munro.png"
                alt="Jack Munro — APP World #1"
                className="w-full aspect-square object-cover"
              />
              <div
                className="p-5 text-center"
                style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
              >
                <p className="text-2xl font-extrabold text-white mb-1 leading-none">Jack Munro</p>
                <p className="text-xs font-bold" style={{ color: CHARTREUSE, letterSpacing: "0.05em" }}>
                  APP WORLD #1 · 6.67 RATED
                </p>
              </div>
            </div>
            <p
              className="text-[12px] text-center mt-4 max-w-xs leading-relaxed"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Plus PPA Signed Pros{" "}
              <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>Augie Ge</span> &amp;{" "}
              <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>Judit Castillo</span>{" "}
              — every drill built by players you watch on tour.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  App preview — delegates to the client AppPreview component which handles
//  the phone-frame rotation animation synced to the video's playback time.
//  Renders nothing if DEMO_VIDEO is null.
// ─────────────────────────────────────────────────────────────────────────────
function AppPreview() {
  if (!DEMO_VIDEO || DEMO_VIDEO.type !== "mp4") return null;
  return <AppPreviewClient src={DEMO_VIDEO.src} />;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Press strip — credibility row under the hero (no fake outlets — uses the
//  source of authority the user controls: who teaches the drills).
// ─────────────────────────────────────────────────────────────────────────────
function PressStrip() {
  return (
    <section
      className="py-7 border-y"
      style={{
        background: "rgba(0,0,0,0.25)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="container-xl">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
            Drills Taught By
          </span>
          {[
            "APP TOUR PROS",
            "PPA TOUR PROS",
            "PPR CERTIFIED COACHES",
            "5.0+ TOURNAMENT PLAYERS",
          ].map((label) => (
            <span
              key={label}
              className="text-xs md:text-sm font-extrabold uppercase tracking-[0.16em]"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Pain points — the "you're not alone" block. Mirrors Easy Lemon's
//  emotional setup with three honest pickleball-specific pain points.
// ─────────────────────────────────────────────────────────────────────────────
function PainPoints() {
  const pains = [
    {
      icon: "🤷",
      title: "You don't know what to drill",
      body:
        "You show up to the court, hit balls for an hour, and leave the same player you walked in. Without a plan, court time turns into casual hitting.",
    },
    {
      icon: "📉",
      title: "You hit a plateau",
      body:
        "You've been a 3.5 for two years. The same opponents keep winning. YouTube videos aren't translating into points on the scoreboard.",
    },
    {
      icon: "👥",
      title: "You can't find a partner",
      body:
        "Drilling solo feels pointless. Group lessons cost $40 a head. Private coaches charge $150 an hour. There's a gap between casual play and real training.",
    },
  ];

  return (
    <section className="py-20 md:py-24">
      <div className="container-xl">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: TEAL }}>
            The Real Problem
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            You&apos;re not getting worse.{" "}
            <span style={{ color: CHARTREUSE }}>You&apos;re just stuck.</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
            Improvement isn&apos;t about more court time. It&apos;s about the right reps,
            in the right order, with the right feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pains.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl p-7 transition-transform hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div className="text-4xl mb-4" aria-hidden>{p.icon}</div>
              <h3 className="text-xl font-extrabold text-white mb-2.5">{p.title}</h3>
              <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Zero risk — the "why is this free?" trust block. Three cards.
// ─────────────────────────────────────────────────────────────────────────────
function ZeroRisk() {
  const reasons = [
    {
      icon: "🎟️",
      title: "Full Access on Day 1",
      body:
        "The free trial isn't a sample reel. You get the entire drill library — every level, every shot, every coach — from minute one.",
    },
    {
      icon: "💳",
      title: "$0 to Start",
      body:
        "Yes, you add a card to start the trial — but nothing is charged during the trial. Cancel before it converts and you pay zero. We don't bury the renewal.",
    },
    {
      icon: "🚪",
      title: "Cancel in 30 Seconds",
      body:
        "Inside the app: My Profile → Membership → Cancel Membership. No phone call, no retention pitch, no \"are you sure?\" maze. We earn the renewal or we don't.",
    },
  ];

  return (
    <section
      className="py-20 md:py-24"
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(60,172,174,0.06) 50%, transparent 100%)",
      }}
    >
      <div className="container-xl">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: CHARTREUSE }}>
            Zero Risk
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Is the trial really free?
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
            Yes — and here&apos;s exactly how it works. If a week with the app
            doesn&apos;t make you a better player, we don&apos;t deserve your
            subscription.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reasons.map((r) => (
            <div
              key={r.title}
              className="rounded-2xl p-7 text-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div className="text-5xl mb-5" aria-hidden>{r.icon}</div>
              <h3 className="text-xl font-extrabold text-white mb-2.5">{r.title}</h3>
              <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Proven Stat — the big "97%" equivalent. We don't fabricate a win rate;
//  we surface concrete, defensible scope (library size, coach roster).
// ─────────────────────────────────────────────────────────────────────────────
function ProvenStat() {
  const stats = [
    { number: "200+", label: "DRILLS IN THE LIBRARY" },
    { number: "10+",  label: "PRO COACHES" },
    { number: "100%", label: "FREE FOR 7 DAYS" },
    { number: "0",    label: "EXCUSES LEFT" },
  ];

  return (
    <section className="py-20 md:py-24">
      <div className="container-xl">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: TEAL }}>
            The Numbers
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            More drills than you&apos;ll ever need.{" "}
            <br className="hidden md:block" />
            <span style={{ color: CHARTREUSE }}>Less guesswork than ever.</span>
          </h2>
        </div>

        <div
          className="rounded-3xl p-8 md:p-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p
                className="text-5xl md:text-6xl font-extrabold tracking-tight mb-2"
                style={{ color: CHARTREUSE }}
              >
                {s.number}
              </p>
              <p className="text-[10px] md:text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.6)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Anchor the abstract numbers to verified humans — defends against
            the "30+ coaches who?" credibility gap. */}
        <p className="text-center text-sm md:text-base mt-7 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
          Built by APP, PPA, and PPR-credentialed coaches — including{" "}
          <span className="font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>
            APP World #1 Jack Munro
          </span>{" "}
          and PPA-signed pros Augie Ge and Judit Castillo.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Library — what you actually get in the app. Replaces a "Recent
//  Settlements" card grid with category cards.
// ─────────────────────────────────────────────────────────────────────────────
function Library() {
  const cats = [
    { title: "Serve",        line: "Placement, spin, and high-percentage targets." },
    { title: "Drive",        line: "Pace, shape, and finishing patterns from the baseline." },
    { title: "Drop",         line: "The one shot every level needs to lock in." },
    { title: "Dink",         line: "Soft hands. Long rallies. NVZ control." },
    { title: "Volley",       line: "Punch volleys, hand speed, and net pressure." },
    { title: "Reset",        line: "Take pace off. Take court back. Find the kitchen." },
    { title: "Ball Machine", line: "Programmed routines for solo training with a Titan or Tennibot." },
    { title: "Wall",         line: "Wall drills you can run anywhere — no court, no partner." },
  ];

  return (
    <section
      className="py-20 md:py-24"
      style={{ background: "rgba(0,0,0,0.30)" }}
    >
      <div className="container-xl">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: CHARTREUSE }}>
            What&apos;s Inside
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Every category. Every level.
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
            Each path comes with a pro breakdown, partner-optional variations,
            and tracking so you can see what&apos;s actually moving the needle.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {cats.map((c, i) => (
            <a
              key={c.title}
              href={PBDRILLS}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl p-5 md:p-6 transition-all hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <p
                className="text-[10px] font-extrabold uppercase tracking-[0.18em] mb-3"
                style={{ color: TEAL }}
              >
                Library · {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="text-lg md:text-xl font-extrabold text-white mb-2">{c.title}</h3>
              <p className="text-[13px] md:text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                {c.line}
              </p>
              <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold" style={{ color: CHARTREUSE }}>
                Open in the app →
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Technique — the "we don't just give you drills, we teach the shot" section.
//  Sits between Library (breadth: 8 categories) and Coaches (proof: who teaches).
//  Shows the six components a player gets for every shot.
// ─────────────────────────────────────────────────────────────────────────────
function Technique() {
  const components = [
    {
      icon: "✋",
      title: "Grip & Paddle Position",
      body: "Continental vs. eastern, paddle angle at contact, wrist lock — what to actually do with your hand.",
    },
    {
      icon: "👣",
      title: "Footwork & Setup",
      body: "Split step, shuffle, recovery — get to the ball balanced so the shot has a chance.",
    },
    {
      icon: "🎯",
      title: "Contact Point",
      body: "Where your paddle meets the ball relative to your body — the difference between a winner and a pop-up.",
    },
    {
      icon: "🔄",
      title: "Swing Path & Follow-Through",
      body: "Low-to-high, compact, finish position. Every shot has a shape, and we show you the right one.",
    },
    {
      icon: "⚠️",
      title: "Common Mistakes",
      body: "The five errors we see at every rec court — diagnosed, demoed, and fixed on camera.",
    },
    {
      icon: "🔑",
      title: "Pro Cues & Cheat Codes",
      body: "The one-line mental cue tour pros use mid-rally. Steal it. Use it. Win.",
    },
  ];

  return (
    <section className="py-20 md:py-24">
      <div className="container-xl">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: TEAL }}>
            Technique Deep Dives
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Every shot. <span style={{ color: CHARTREUSE }}>Broken down to the bone.</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
            It&apos;s not just <em>what</em> to drill — it&apos;s <em>how</em> to actually hit
            the shot. Every paddle position, every footwork pattern, every cue
            the pros use mid-rally.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-10">
          {components.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl p-6 md:p-7 transition-transform hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div className="text-3xl mb-3" aria-hidden>{c.icon}</div>
              <h3 className="text-lg font-extrabold text-white mb-2">{c.title}</h3>
              <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                {c.body}
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-5 md:p-6 text-center max-w-3xl mx-auto"
          style={{
            background: "rgba(60,172,174,0.08)",
            border: `1px solid ${TEAL}`,
          }}
        >
          <p className="text-sm md:text-base" style={{ color: "rgba(255,255,255,0.92)" }}>
            <span className="font-extrabold" style={{ color: CHARTREUSE }}>Available for every shot:</span>{" "}
            serve · drive · drop · dink · volley · reset.{" "}
            <span style={{ color: "rgba(255,255,255,0.7)" }}>
              Pick a shot, watch the breakdown, take it to the court.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Meet the Coaches — placeholder team grid. Drop real headshots into
//  /public/images/pbdrills-coaches/<slug>.jpg and update the COACHES array.
//  Until then, each card renders an initials avatar in chartreuse/teal so the
//  section reads as "real people coming, image pending" instead of broken.
// ─────────────────────────────────────────────────────────────────────────────
const COACHES: { name: string; title: string; rating?: string; image?: string }[] = [
  { name: "Jack Munro",     title: "APP World #1",     rating: "6.67 Rated", image: "/images/pbdrills-coaches/Jack-Munro.png" },
  { name: "Augie Ge",       title: "PPA Signed Pro",   rating: "6.32 Rated", image: "/images/pbdrills-coaches/Augie-Ge.png" },
  { name: "Judit Castillo", title: "PPA Signed Pro",   rating: "5.71 Rated", image: "/images/pbdrills-coaches/Judit-Castillo.png" },
  { name: "Austin Hardy",   title: "PPR Certified Coach", rating: "5.4 Rated", image: "/images/pbdrills-coaches/Austin-Hardy.png" },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Coaches() {
  return (
    <section className="py-20 md:py-24">
      <div className="container-xl">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: CHARTREUSE }}>
            Meet the Coaches
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Taught by the pros you already watch.
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
            Every drill in the library is built and demonstrated by a real APP or
            PPA tour pro — not a stock-footage instructor.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-5 max-w-5xl mx-auto">
          {COACHES.map((c, i) => (
            <div key={i} className="text-center">
              <div
                className="aspect-square rounded-2xl flex items-center justify-center overflow-hidden mb-4 mx-auto relative"
                style={{
                  background: c.image
                    ? "rgba(255,255,255,0.04)"
                    : `linear-gradient(135deg, rgba(60,172,174,0.20) 0%, rgba(222,250,50,0.15) 100%)`,
                  border: "1px solid rgba(255,255,255,0.10)",
                  maxWidth: 220,
                }}
              >
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <span
                    className="text-4xl md:text-5xl font-extrabold"
                    style={{ color: CHARTREUSE, letterSpacing: "0.02em" }}
                  >
                    {initials(c.name)}
                  </span>
                )}
              </div>
              <p className="text-base md:text-lg font-extrabold text-white">{c.name}</p>
              <p className="text-xs mt-1" style={{ color: TEAL, fontWeight: 700 }}>
                {c.title}
              </p>
              {c.rating && (
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                  {c.rating}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Testimonials — only renders if real quotes are in the TESTIMONIALS array
//  up top. Empty array → section hidden. Never ship fabricated quotes.
// ─────────────────────────────────────────────────────────────────────────────
function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="py-20 md:py-24" style={{ background: "rgba(0,0,0,0.30)" }}>
      <div className="container-xl">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: CHARTREUSE }}>
            What Players Say
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Real players. <span style={{ color: CHARTREUSE }}>Real rating climbs.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl p-7 flex flex-col"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {t.stars && (
                <div className="mb-3 text-base tracking-[0.15em]" style={{ color: "#f4b400" }} aria-label={`${t.stars} stars`}>
                  {"★".repeat(t.stars)}
                </div>
              )}
              <p className="text-base leading-relaxed mb-5 flex-1" style={{ color: "rgba(255,255,255,0.88)" }}>
                “{t.quote}”
              </p>
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                {t.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                    style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                  />
                )}
                <div>
                  <p className="text-sm font-extrabold text-white">{t.name}</p>
                  {t.source && (
                    <p className="text-xs mt-0.5" style={{ color: TEAL, fontWeight: 700 }}>
                      {t.source}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  How it works — 4 steps
// ─────────────────────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: "Start your free trial",
      body: "Sign up in 30 seconds. Add a card, start free, cancel anytime.",
    },
    {
      n: 2,
      title: "Pick where you're stuck",
      body: "Choose your level, your weakest shot, and the time you have.",
    },
    {
      n: 3,
      title: "Run a pro-built drill",
      body: "Step-by-step instructions, video breakdowns, and partner-optional reps.",
    },
    {
      n: 4,
      title: "See it on the scoreboard",
      body: "Track what you've drilled. Watch your rating climb. Renew if it does.",
    },
  ];

  return (
    <section className="py-20 md:py-24">
      <div className="container-xl">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: TEAL }}>
            Simple Process
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            From first tap to first win.
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
            No paywall maze. No upgrade nudge halfway through. Just drills and a way to run them.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3">
          {/* Connecting line on desktop */}
          <div
            className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${TEAL} 20%, ${CHARTREUSE} 80%, transparent 100%)`,
              opacity: 0.45,
            }}
          />
          {steps.map((s) => (
            <div key={s.n} className="relative text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-xl font-extrabold relative z-10"
                style={{
                  background: "#0a1628",
                  color: CHARTREUSE,
                  border: `2px solid ${CHARTREUSE}`,
                  boxShadow: "0 0 24px rgba(222,250,50,0.20)",
                }}
              >
                {s.n}
              </div>
              <h3 className="text-lg font-extrabold text-white mb-2">{s.title}</h3>
              <p className="text-sm leading-relaxed px-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
//  FAQ — accordion. Server-rendered with details/summary so we don't need
//  client state.
// ─────────────────────────────────────────────────────────────────────────────
function FAQ() {
  const faqs = [
    {
      q: "Is the trial actually free?",
      a: "Yes. You add a card at signup so the trial can roll into a subscription if you love it — but nothing is charged during the trial. Full library access from minute one. Cancel before it converts in two taps and you pay zero.",
    },
    {
      q: "Why pay when YouTube is free?",
      a: "YouTube is a thousand tabs. We're one app. Every drill is filed by shot, level, and time — so you stop spending the first 15 minutes of court time scrolling, and start the rep. The technique breakdowns are by APP and PPA tour pros, not someone's hot take with a ring light. And every drill scales for solo, partner, or ball-machine — so it travels with you regardless of who shows up.",
    },
    {
      q: "What if I'm brand new to pickleball?",
      a: "There's a dedicated beginner track that builds the four fundamentals (dink, drop, drive, serve) before anything else. You'll know what to drill on day one.",
    },
    {
      q: "Do I need a partner to use the app?",
      a: "No. Roughly half the drills are designed for solo training — wall work, shadow patterns, or ball-machine routines. The rest scale up the moment you have a partner.",
    },
    {
      q: "Who builds the drills?",
      a: "Active APP and PPA tour pros, plus PPR-certified coaches. Every drill includes a video breakdown from the coach who built it, with strategy cues and target outcomes. For the full technique breakdown — grip, footwork, contact point, swing path — tap the \"How To\" button at the top of any shot screen.",
    },
    {
      q: "Will it work on my phone?",
      a: "iOS and Android, plus tablet. Most players run it courtside between rotations — open the app, see the drill, run it, log it.",
    },
    {
      q: "How easy is it to cancel?",
      a: "From the Home tab: tap My Profile → Membership → Cancel Membership. Three taps, no phone call, no retention chat, no \"are you sure?\" maze.",
    },
  ];

  return (
    <section
      className="py-20 md:py-24"
      style={{ background: "rgba(0,0,0,0.30)" }}
    >
      <div className="container-xl max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: CHARTREUSE }}>
            Common Questions
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Everything you might be wondering.
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <summary
                className="cursor-pointer list-none px-6 py-5 flex items-center justify-between gap-4 select-none"
              >
                <span className="text-base md:text-lg font-bold text-white">{f.q}</span>
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-transform group-open:rotate-45 text-lg font-bold"
                  style={{
                    background: "rgba(222,250,50,0.12)",
                    color: CHARTREUSE,
                    border: `1px solid ${CHARTREUSE}`,
                  }}
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <div
                className="px-6 pb-5 text-[15px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Final CTA — the dark band at the bottom
// ─────────────────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section
      className="py-20 md:py-28 text-center"
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(222,250,50,0.05) 100%), #0a1628",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="container-xl max-w-3xl mx-auto">
        <h2
          className="font-extrabold tracking-tight text-white mb-5"
          style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)", lineHeight: 1.05 }}
        >
          Your next rating bump is ready.{" "}
          <span style={{ color: CHARTREUSE }}>Are you?</span>
        </h2>
        <p className="text-lg mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>
          Every drill. Every coach. Zero out of pocket to start.
        </p>
        <p className="text-sm mb-9 inline-flex items-center gap-2" style={{ color: "rgba(255,255,255,0.55)" }}>
          <span aria-hidden>💸</span>
          Less than one group lesson. Way less than a single private hour.
        </p>

        <div className="flex items-center justify-center">
          <a
            href={PBDRILLS}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 font-extrabold text-base px-10 py-5 rounded-2xl tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: CHARTREUSE,
              color: "#0a1628",
              boxShadow: "0 0 64px rgba(222,250,50,0.45), 0 6px 24px rgba(0,0,0,0.45)",
            }}
          >
            START FREE TODAY →
          </a>
        </div>

        <p className="text-xs mt-7" style={{ color: "rgba(255,255,255,0.45)" }}>
          Cancel anytime · iOS &amp; Android
        </p>
      </div>
    </section>
  );
}
