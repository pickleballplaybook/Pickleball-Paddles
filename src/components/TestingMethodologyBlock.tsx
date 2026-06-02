import Link from "next/link";
import { Beaker, ArrowRight, CheckCircle2 } from "lucide-react";

interface Props {
  brand: string;
  name: string;
}

/**
 * TestingMethodologyBlock
 * -----------------------
 * Rendered on every paddle detail page near the comparison sections.
 * Tells the reader (and Google) exactly how this paddle was evaluated and
 * links back to /how-we-test for the full protocol. This is the E-E-A-T
 * "experience" signal — it converts a paddle page from "a review" into
 * "a primary-source review with documented methodology."
 */
export default function TestingMethodologyBlock({ brand, name }: Props) {
  return (
    <section className="py-16">
      <div className="container-xl max-w-4xl">
        <div
          className="rounded-3xl p-6 md:p-8"
          style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
        >
          <div className="flex items-start gap-4 mb-5">
            <div
              className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(20,184,166,0.15)" }}
            >
              <Beaker className="w-5 h-5" style={{ color: "#2dd4bf" }} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: "rgba(20,184,166,0.85)" }}>
                Methodology
              </p>
              <h2 className="text-xl md:text-2xl font-extrabold leading-tight" style={{ color: "var(--flip-text-head)" }}>
                How we tested the {brand} {name}
              </h2>
            </div>
          </div>

          <p className="text-sm md:text-base leading-relaxed mb-5" style={{ color: "var(--flip-text-body)" }}>
            Every paddle on this site goes through the same five-step protocol — lab measurement first, then
            structured on-court drills with a partner. No shortcuts, no guessing, no relying on the
            brand&apos;s spec sheet.
          </p>

          <ul className="space-y-2.5 mb-6">
            {[
              {
                title: "Lab-measured specs",
                body: "Static weight, swing weight, and twist weight measured on calibrated equipment — not pulled from the brand's claim sheet.",
              },
              {
                title: "10-minute break-in",
                body: "Drives, dinks, drops, and resets to let the face settle in before any verdict is recorded.",
              },
              {
                title: "Baseline power & spin",
                body: "Drives, topspin patterns, and serves with a drilling partner to evaluate raw power and ball pocketing.",
              },
              {
                title: "Kitchen touch & control",
                body: "Dinking, third-shot drops, and resets to evaluate dwell time, plushness, and mishit forgiveness.",
              },
              {
                title: "Transition firepower",
                body: "Mid-court exchanges and hand-speed battles where shape and twist weight separate the great from the average.",
              },
            ].map((step) => (
              <li key={step.title} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} />
                <div className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body)" }}>
                  <span className="font-bold" style={{ color: "var(--flip-text-head)" }}>{step.title}.</span>{" "}
                  <span style={{ color: "var(--flip-text-muted)" }}>{step.body}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3 items-center">
            <Link
              href="/how-we-test"
              className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-full transition-colors hover:bg-teal-400/20"
              style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.3)" }}
            >
              Full Testing Protocol
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-full transition-colors"
              style={{ background: "transparent", color: "var(--flip-text-head)", border: "1px solid var(--flip-card-border)" }}
            >
              Meet Austin
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
