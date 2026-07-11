import { CheckCircle2 } from "lucide-react";

const SIGNALS = [
  {
    title: "70,000+ players trust our reviews",
    body: "Our community keeps growing because players find paddles that actually fit their game.",
  },
  {
    title: "No paid or sponsored reviews — ever",
    body: "Every review is independent. Brands can't pay to influence our ratings or rankings.",
  },
  {
    title: "Real drilling & on-court testing",
    body: "We don't just unbox. Every paddle is drilled with, driven, dinked, and put through its paces.",
  },
  {
    title: "Tested by players, not marketers",
    body: "Our reviewers are pickleball obsessives who play 3.5–5.0 DUPR. We speak the language.",
  },
];

export default function WhyTrust() {
  return (
    <section className="section-y bg-slate-50">
      <div className="container-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — heading */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>
              Our Promise
            </p>
            <h2
              className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5"
              style={{ color: "#163a6a" }}
            >
              Why Trust Pickleball Playbook?
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed max-w-md">
              There are a lot of "review" sites out there. Here's what makes us different — and why players
              keep coming back.
            </p>
          </div>

          {/* Right — signals */}
          <div className="space-y-5">
            {SIGNALS.map(({ title, body }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle2
                    className="w-6 h-6"
                    style={{ color: "#60a5fa" }}
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-[15px] leading-snug mb-0.5">{title}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
