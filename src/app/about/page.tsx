import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Youtube, Mail, Trophy, GraduationCap, Video, ShoppingBag } from "lucide-react";
import { siteConfig } from "@/config/site";

const PAGE_URL = `${siteConfig.siteUrl}/about`;

export const metadata: Metadata = {
  title: "About Austin Hardy — Founder & Lead Reviewer",
  description:
    "Pickleball Playbook is run by Austin Hardy — PPR-certified coach, pro player, and pickleball gear reviewer with 12+ years coaching racket sports. Every paddle is independently tested on-court with measured specs.",
  keywords: [
    "Austin Hardy pickleball",
    "Pickleball Playbook reviews",
    "pickleball paddle reviewer",
    "PPR certified pickleball coach",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "About Austin Hardy — Pickleball Playbook",
    description:
      "PPR-certified coach and pro player. 12+ years coaching. Every paddle independently tested on-court with measured specs.",
    url: PAGE_URL,
    type: "profile",
    siteName: siteConfig.name,
    images: [{ url: `${siteConfig.siteUrl}/images/Austin-head-shot.png`, alt: "Austin Hardy — Pickleball Playbook" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Austin Hardy — Pickleball Playbook",
    description: "PPR-certified coach. 12+ years coaching. Every paddle independently tested.",
    images: [`${siteConfig.siteUrl}/images/Austin-head-shot.png`],
  },
};

// ── JSON-LD: Person + Organization schemas ─────────────────────────────────
// These signal authorship and entity to Google. The Person schema is what
// gets associated with every Review/Article on the site through the existing
// "author" fields in the per-paddle JSON-LD blocks.
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${siteConfig.siteUrl}/about#austin-hardy`,
  name: "Austin Hardy",
  givenName: "Austin",
  familyName: "Hardy",
  jobTitle: "Founder & Lead Reviewer at Pickleball Playbook",
  url: PAGE_URL,
  image: `${siteConfig.siteUrl}/images/Austin-head-shot.png`,
  description:
    "PPR-certified pickleball coach, pro player, and gear reviewer with 12+ years coaching racket sports. Founder of Pickleball Playbook Reviews.",
  knowsAbout: [
    "Pickleball",
    "Pickleball Paddles",
    "Pickleball Coaching",
    "Pickleball Equipment Testing",
    "Racket Sports",
  ],
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: "PPR Certified Pickleball Coach",
      recognizedBy: { "@type": "Organization", name: "Professional Pickleball Registry" },
    },
  ],
  worksFor: { "@id": `${siteConfig.siteUrl}#organization` },
  sameAs: [siteConfig.youtubeChannelUrl, siteConfig.substackUrl],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteConfig.siteUrl}#organization`,
  name: "Pickleball Playbook",
  alternateName: "Pickleball Playbook Reviews",
  url: siteConfig.siteUrl,
  logo: `${siteConfig.siteUrl}${siteConfig.logoPath}`,
  description:
    "Independent pickleball paddle reviews with lab-measured specs and on-court testing. Founded by Austin Hardy.",
  founder: { "@id": `${siteConfig.siteUrl}/about#austin-hardy` },
  sameAs: [siteConfig.youtubeChannelUrl, siteConfig.substackUrl],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Are Pickleball Playbook reviews sponsored?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "No. Brands do not pay for reviews, ratings, or placement. We use affiliate links and discount codes on many paddles — those help fund the site — but the review itself is never influenced by whether a brand has an affiliate program with us. Negative reviews get published exactly the same as positive ones.",
      },
    },
    {
      "@type": "Question",
      name: "Do you accept free paddles from brands?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Sometimes — brands occasionally send paddles for testing. When that happens, it does not change the review process or the verdict. We disclose any sample paddles when relevant. We also buy paddles directly when needed to keep coverage broad.",
      },
    },
    {
      "@type": "Question",
      name: "How do you decide which paddles to review?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "We prioritize paddles people are actively searching for (Google Trends, search volume, Reddit discussion), new launches from major brands, and reader requests. We also test paddles brands send in cold — many of those reviews lead to discount-code partnerships only after the review is written.",
      },
    },
    {
      "@type": "Question",
      name: "How are paddles tested?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Every paddle goes through three stages: lab measurement (static weight, swing weight, twist weight on standardized equipment), a 5–10 minute break-in across all shot types, then a structured on-court drilling session with a partner covering drives, dinks, drops, resets, and transition exchanges. Full protocol on the How We Test page.",
      },
    },
    {
      "@type": "Question",
      name: "Are the discount codes legit?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Yes. PLAYBOOK works at checkout on the brand's official site for most partners — saving you 5–20% depending on the brand. For Selkirk products on selkirk.com, the code is INF-PLAYBOOK (gift-card credit). Every code is tested before being published, and the discount amounts shown on the site are accurate.",
      },
    },
    {
      "@type": "Question",
      name: "Who is Austin Hardy?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Austin Hardy is the founder and lead reviewer at Pickleball Playbook. He's a PPR-certified pickleball coach, pro player, and a 12+ year racket-sports coach. He runs the YouTube channel and writes every review on this site personally.",
      },
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      {/* JSON-LD: Person + Organization + FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl py-20 md:py-28">

          {/* ── HERO ────────────────────────────────────────────────────────── */}
          <div className="max-w-3xl">
            <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4">
              Our Story
            </p>
            <h1
              className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Finding the Right Paddle
              <br />
              <span style={{ color: "#60a5fa" }}>Shouldn&apos;t Be a Guessing Game.</span>
            </h1>

            {/* Intro with headshot */}
            <div className="flex items-start gap-5 mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/Austin-head-shot.png"
                alt="Austin Hardy — Pickleball Playbook founder"
                className="w-16 h-16 rounded-full object-cover flex-shrink-0 mt-1"
                style={{ border: "2px solid rgba(10, 100, 188,0.4)" }}
              />
              <div>
                <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Austin Hardy</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Founder · PPR Certified Coach · Pro Player · 12+ Years Coaching
                </p>
              </div>
            </div>

            <div className="space-y-5 mb-12 max-w-2xl">
              <p className="text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Like a lot of players, I spent years trying to decode paddle spec sheets and reading reviews that felt more like marketing copy than real feedback. The problem is that specs only tell half the story. Swing weight and twist weight give you a useful baseline — but they can&apos;t tell you how a paddle feels when you&apos;re resetting from the transition zone at 4-4 in the third game.
              </p>
              <p className="text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
                As a pro player and PPR-certified coach with over 12 years of experience, I knew there was a better way to evaluate gear. So I built Pickleball Playbook Reviews with one goal in mind: help players find the right paddle for their game — not just the one with the best numbers on paper, but the one that actually performs where it matters most. On the court.
              </p>
              <p className="text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Every review on this site is tested in person, filmed on a real court, and written to give you the honest picture — what it&apos;s good at, what it isn&apos;t, and who it&apos;s best suited for.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/paddles" className="btn-primary text-base px-8 py-4">
                Browse All Paddles
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/how-we-test"
                className="text-base px-8 py-4 rounded-full font-bold inline-flex items-center gap-2 transition-colors"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                Full Testing Protocol
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ── CREDENTIALS GRID ────────────────────────────────────────────── */}
          <div className="mt-20 max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
              Credentials
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
              Who&apos;s actually writing these reviews
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: GraduationCap, value: "PPR", label: "Certified Coach" },
                { icon: Trophy,        value: "Pro", label: "Tournament Player" },
                { icon: Video,         value: "100+", label: "Paddles Reviewed" },
                { icon: ShoppingBag,   value: "12+", label: "Years in Racket Sports" },
              ].map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl p-5"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <Icon className="w-5 h-5 mb-3" style={{ color: "#60a5fa" }} />
                  <p className="text-2xl font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>{value}</p>
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── HOW WE REVIEW (existing 3-step content preserved) ───────────── */}
          <div className="mt-24 max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
              The Process
            </p>
            <h2
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              How We Review Paddles
            </h2>
            <p className="text-lg mb-14" style={{ color: "var(--text-muted)" }}>
              Every paddle goes through the same three-step process before we record a single frame. No shortcuts, no guessing.
            </p>

            <div className="flex flex-col gap-12">
              {[
                {
                  step: "01",
                  title: "Measure the Specs",
                  body: "Before anything else, we measure static weight, swing weight, and twist weight using standardized testing equipment. These numbers give us an objective baseline and allow for direct, apples-to-apples comparisons across every paddle in our database.",
                  image: "/images/about/Step-1.png",
                  alt: "Briffidi swing weight measurement device with paddle",
                },
                {
                  step: "02",
                  title: "Break In the Paddle",
                  body: "Every paddle gets 5–10 minutes of deliberate warm-up before the real review begins. We work through every type of shot — drives, dinks, drops, and resets — to properly break in the surface and get a consistent, representative feel before we start evaluating.",
                  image: "/images/about/Step-2.png",
                  alt: "Austin Hardy hitting on a pickleball court during paddle break-in",
                },
                {
                  step: "03",
                  title: "On-Court Review with a Drilling Partner",
                  body: "With the paddle properly broken in, we run structured drills alongside a partner to evaluate three key areas: power and spin off the baseline, touch and control at the kitchen, and firepower in transition exchanges. Everything you need to know to decide if a paddle fits your game.",
                  image: "/images/about/Step-3.png",
                  alt: "Austin Hardy drilling with a partner on a pickleball court",
                },
              ].map(({ step, title, body, image, alt }, i) => (
                <div
                  key={step}
                  className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 md:gap-12 items-center`}
                >
                  <div
                    className="w-full md:w-1/2 rounded-3xl overflow-hidden flex-shrink-0"
                    style={{ aspectRatio: "1 / 1", background: "var(--bg-alt)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={alt} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <span className="inline-block text-5xl font-extrabold leading-none mb-4" style={{ color: "rgba(10, 100, 188,0.30)" }}>
                      {step}
                    </span>
                    <h3 className="text-2xl font-extrabold mb-3" style={{ color: "var(--text-primary)" }}>
                      {title}
                    </h3>
                    <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-5 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--text-primary)" }}>Want the full protocol?</strong>{" "}
                The complete testing methodology — exact equipment, scoring rubric, and how we translate specs to gameplay — is documented on the{" "}
                <Link href="/how-we-test" className="font-bold" style={{ color: "#60a5fa" }}>How We Test page →</Link>
              </p>
            </div>
          </div>

          {/* ── EDITORIAL STANDARDS / DISCLOSURE ────────────────────────────── */}
          <div className="mt-24 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
              Editorial Standards
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
              Independence &amp; Disclosure
            </h2>
            <div className="space-y-5 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>No paid reviews.</strong> Brands do not pay for reviews,
                star ratings, or placement on this site. Negative reviews get published the same way positive ones do —
                that&apos;s the only way the reviews are worth anything.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Affiliate links + discount codes.</strong> Many paddles
                have affiliate links and a discount code (typically PLAYBOOK or INF-PLAYBOOK) — when you buy through
                those links, the site earns a small commission at no extra cost to you. That commission helps fund the
                testing, equipment, and court time. It does not influence which paddles get reviewed or how they&apos;re
                rated.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Sample paddles.</strong> Some paddles are sent free
                by brands for testing. When that&apos;s the case, the review process is exactly the same. Many of those
                cold-sample reviews lead to affiliate partnerships only after the review is written — never as a
                condition for one.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Lab-measured specs.</strong> Static weight, swing
                weight, and twist weight are measured on standardized equipment — not pulled from brand spec sheets.
                When a measurement isn&apos;t available yet, the paddle&apos;s page is marked clearly rather than
                showing an estimated number.
              </p>
            </div>
          </div>

          {/* ── FAQ ─────────────────────────────────────────────────────────── */}
          <div className="mt-24 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
              FAQ
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
              Common questions
            </h2>
            <div className="flex flex-col gap-5">
              {faqSchema.mainEntity.map((q) => (
                <div
                  key={q.name}
                  className="rounded-2xl p-5"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    {q.name}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {q.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── CONNECT ─────────────────────────────────────────────────────── */}
          <div className="mt-24 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
              Connect
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
              Get in touch
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href={siteConfig.youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl p-5 transition-colors hover:border-teal-400/50"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <Youtube className="w-5 h-5 mb-3 text-red-500" />
                <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>YouTube</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Watch every review filmed on court</p>
              </a>
              <a
                href={siteConfig.substackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl p-5 transition-colors hover:border-teal-400/50"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <Mail className="w-5 h-5 mb-3" style={{ color: "#60a5fa" }} />
                <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>Newsletter</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Weekly paddle picks + discount codes</p>
              </a>
              <Link
                href="/contact"
                className="rounded-2xl p-5 transition-colors hover:border-teal-400/50"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <Mail className="w-5 h-5 mb-3" style={{ color: "#60a5fa" }} />
                <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>Contact</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Review request, partnerships, feedback</p>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
