import { Metadata } from "next";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2, Youtube } from "lucide-react";
import SubstackEmbed from "@/components/SubstackEmbed";
import { siteConfig } from "@/config/site";

const SUBSTACK_URL = "https://pickleballplaybookreviews.substack.com/";

export const metadata: Metadata = {
  title: "Newsletter — Free Paddle Reviews & Deals",
  description:
    "Subscribe to the Pickleball Playbook newsletter. Get early paddle reviews, lab-measured specs, exclusive discount codes, and weekly trending paddles — free, straight to your inbox.",
  alternates: { canonical: `${siteConfig.siteUrl}/newsletter` },
  openGraph: {
    title: "Pickleball Playbook Newsletter — Free Reviews & Deals",
    description: "Early paddle reviews, exclusive discount codes, and weekly trending paddles. Free.",
    url: `${siteConfig.siteUrl}/newsletter`,
    type: "website",
    siteName: siteConfig.name,
  },
};

const BENEFITS = [
  "Early access to new paddle reviews before they go public",
  "Exclusive discount codes not available on the website",
  "Weekly trending paddles — see what players are buying",
  "Lab-measured specs breakdowns and comparisons",
  "Gear deals on ball machines, shoes, and accessories",
];

export default function NewsletterPage() {
  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-16">

        <div className="max-w-2xl mx-auto text-center">

          {/* Icon */}
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: "rgba(10, 100, 188,0.30)", border: "1px solid rgba(10, 100, 188,0.3)" }}
          >
            <Mail className="w-7 h-7" style={{ color: "#60a5fa" }} />
          </div>

          {/* Headline */}
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            The Playbook Newsletter
          </h1>
          <p className="text-lg mb-8" style={{ color: "var(--text-muted)" }}>
            Free paddle reviews, exclusive deals, and weekly trending paddles — straight to your inbox.
            Written by Austin Hardy, 5.5+ player and independent reviewer.
          </p>

          {/* Substack official embed — true 1-click signup, no redirect. */}
          <div className="flex justify-center mb-12">
            <SubstackEmbed height={360} />
          </div>

          {/* Benefits */}
          <div
            className="rounded-2xl p-8 text-left mb-12"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#60a5fa" }}>
              What You Get
            </p>
            <div className="flex flex-col gap-4">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#60a5fa" }} />
                  <p className="text-base" style={{ color: "var(--text-primary)" }}>
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* About the reviewer */}
          <div
            className="rounded-2xl p-6 text-left mb-12"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(10, 100, 188,0.30)" }}>
                <span className="text-sm font-bold" style={{ color: "#60a5fa" }}>AH</span>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Austin Hardy</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>5.5+ player &middot; Independent reviewer</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Every paddle is tested on court with lab-measured swing weight, twist weight, and static weight.
              No brand sponsors. No paid placements. Just honest reviews and the best discount codes I can find.
            </p>
          </div>

          {/* Also follow on YouTube */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold text-sm px-8 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
              style={{ background: "#0a64bc" }}
            >
              <Mail className="w-4 h-4" /> Subscribe to Newsletter
            </a>
            <a
              href={siteConfig.youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:scale-[1.02]"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-primary)" }}
            >
              <Youtube className="w-4 h-4 text-red-500" /> @playbookpaddles
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
