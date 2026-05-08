import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `${siteConfig.name} — helping players find the best paddle deals with code ${siteConfig.discountCode}.`,
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-20 md:py-28">
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
            <span style={{ color: "#14b8a6" }}>Shouldn&apos;t Be a Guessing Game.</span>
          </h1>

          {/* Intro with headshot */}
          <div className="flex items-start gap-5 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/Austin-head-shot.png"
              alt="Austin Hardy"
              className="w-16 h-16 rounded-full object-cover flex-shrink-0 mt-1"
              style={{ border: "2px solid rgba(20,184,166,0.4)" }}
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

          <Link href="/paddles" className="btn-primary text-base px-8 py-4">
            Start Browsing Paddles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── How We Review ────────────────────────────────────────────────── */}
        <div className="mt-24 max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
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
                {/* Image */}
                <div
                  className="w-full md:w-1/2 rounded-3xl overflow-hidden flex-shrink-0"
                  style={{ aspectRatio: "1 / 1", background: "var(--bg-alt)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={alt}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <span
                    className="inline-block text-5xl font-extrabold leading-none mb-4"
                    style={{ color: "rgba(20,184,166,0.18)" }}
                  >
                    {step}
                  </span>
                  <h3
                    className="text-2xl font-extrabold mb-3"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {title}
                  </h3>
                  <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
