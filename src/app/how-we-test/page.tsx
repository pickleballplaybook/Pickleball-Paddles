import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Scale, Activity, Target, Repeat, ClipboardList, Beaker } from "lucide-react";
import { siteConfig } from "@/config/site";

const PAGE_URL = `${siteConfig.siteUrl}/how-we-test`;

export const metadata: Metadata = {
  title: "How We Test Pickleball Paddles — Methodology",
  description:
    "The full Pickleball Playbook testing methodology — lab equipment, measurement protocol, on-court drill structure, and how we translate specs into real gameplay verdicts. Every paddle on the site goes through this exact process.",
  keywords: [
    "how pickleball paddles are tested",
    "pickleball paddle testing methodology",
    "swing weight measurement",
    "twist weight measurement",
    "pickleball paddle review process",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "How We Test Pickleball Paddles — Methodology",
    description: "The full testing methodology — equipment, protocol, and scoring used in every review.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    images: [{ url: `${siteConfig.siteUrl}/images/about/Step-1.png`, alt: "Pickleball paddle testing methodology" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How We Test Pickleball Paddles",
    description: "The full methodology — equipment, protocol, and scoring used in every review.",
  },
};

// ── JSON-LD: HowTo schema ──────────────────────────────────────────────────
// HowTo schema is uniquely well-suited to a methodology page — Google
// sometimes surfaces these as step-by-step SERP boxes. Each step gets its
// own name + text so each is independently snippet-eligible.
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How We Test Pickleball Paddles",
  description:
    "The five-step protocol used by Pickleball Playbook to review every paddle — lab measurement, break-in, baseline drills, kitchen drills, and transition drills.",
  totalTime: "PT2H",
  supply: [
    { "@type": "HowToSupply", name: "Pickleball paddle (the one under review)" },
    { "@type": "HowToSupply", name: "USAP-approved tournament pickleballs" },
    { "@type": "HowToSupply", name: "Regulation pickleball court" },
    { "@type": "HowToSupply", name: "Drilling partner" },
  ],
  tool: [
    { "@type": "HowToTool", name: "Briffidi calibrated swing weight measurement device" },
    { "@type": "HowToTool", name: "Calibrated digital scale (gram precision)" },
    { "@type": "HowToTool", name: "Twist weight measurement rig" },
    { "@type": "HowToTool", name: "Video camera for review recording" },
  ],
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Measure static weight, swing weight, and twist weight",
      text:
        "Weigh the paddle on a calibrated digital scale for static weight. Use a Briffidi-style swing weight rig to measure rotational moment about the hand axis. Run the twist weight measurement to capture the paddle's resistance to off-center hits. All three numbers go into the database before any on-court testing begins.",
      url: `${PAGE_URL}#step-1-measure`,
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Break in the paddle with a 5–10 minute warm-up",
      text:
        "Hit deliberate drives, dinks, drops, and resets to break in the surface and let the carbon fiber face settle in. New paddles play differently after the first hour — we never review a paddle straight out of the wrapper.",
      url: `${PAGE_URL}#step-2-break-in`,
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Test baseline power and spin",
      text:
        "Run structured drives and topspin drills from the baseline with a drilling partner. Evaluate raw power, ball pocketing, spin generation off the face, and serve performance. This is where high-swing-weight paddles separate from balanced ones.",
      url: `${PAGE_URL}#step-3-baseline`,
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Test touch and control at the kitchen",
      text:
        "Run dinking patterns, third-shot drops, and resets at the non-volley zone. Evaluate dwell time on contact, plushness on soft shots, and how forgiving the paddle is on off-center kitchen exchanges. Touch-oriented paddles shine here; stiff power paddles often struggle.",
      url: `${PAGE_URL}#step-4-kitchen`,
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Test transition zone firepower",
      text:
        "Run rapid-fire mid-court exchanges, hand-speed battles at the kitchen, and reset-to-attack sequences. This is where shape and twist weight matter most — elongated paddles win on reach, widebodies win on forgiveness, hybrids split the difference.",
      url: `${PAGE_URL}#step-5-transition`,
    },
  ],
};

const steps = [
  {
    n: "01",
    icon: Scale,
    id: "step-1-measure",
    title: "Measure the Specs",
    summary: "Static weight, swing weight, twist weight — measured before the paddle ever hits the court.",
    body: (
      <>
        <p>
          Every paddle starts on the bench, not the court. We measure three numbers before anything else:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>
            <strong>Static weight</strong> — on a calibrated digital scale to the gram. The number you see on
            other sites is often the manufacturer&apos;s spec — our number is what the paddle actually weighs.
          </li>
          <li>
            <strong>Swing weight</strong> — the rotational moment around the hand. Measured on a Briffidi-style
            swing weight device. This is the single best predictor of how a paddle feels in motion.
          </li>
          <li>
            <strong>Twist weight</strong> — how much the paddle resists twisting on off-center hits. Higher TW =
            more forgiving on mishits. This number is almost never on the manufacturer&apos;s spec sheet but
            it&apos;s arguably the most important spec for everyday players.
          </li>
        </ul>
        <p className="mt-3">
          All three numbers land in the database and show up on the paddle&apos;s detail page with mini spec bars
          comparing them to the catalog average — so you can see at a glance whether a paddle is heavier, lighter,
          or more forgiving than typical.
        </p>
      </>
    ),
  },
  {
    n: "02",
    icon: Activity,
    id: "step-2-break-in",
    title: "Break In the Paddle",
    summary: "5–10 minutes of deliberate warm-up across every shot type, before any review begins.",
    body: (
      <>
        <p>
          New paddles play differently after the first hour. Carbon-fiber faces, foam cores, and surface textures
          all settle in once they&apos;ve absorbed some real contact. Skipping the break-in is one of the most
          common review mistakes — a paddle reviewed straight out of the wrapper isn&apos;t the same paddle the
          buyer ends up with.
        </p>
        <p className="mt-3">
          The warm-up covers every shot type the review will touch: drives, dinks, drops, resets, and serves.
          5–10 minutes of deliberate hitting at moderate intensity, no scoring, no pressure — just letting the
          paddle find its baseline feel.
        </p>
      </>
    ),
  },
  {
    n: "03",
    icon: Target,
    id: "step-3-baseline",
    title: "Baseline — Power & Spin",
    summary: "Structured drives, topspin drills, and serves with a drilling partner.",
    body: (
      <>
        <p>
          With the paddle broken in, the real test begins at the baseline. We run drives, topspin patterns, and
          serves and evaluate four things:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Raw power</strong> — how hot the paddle plays on a full swing</li>
          <li><strong>Ball pocketing</strong> — how long the ball stays on the face (dwell time)</li>
          <li><strong>Spin generation</strong> — does the surface bite the ball, or skid?</li>
          <li><strong>Serve performance</strong> — pace, placement consistency, and feel</li>
        </ul>
        <p className="mt-3">
          This is where the swing weight number from Step 1 starts to translate into real gameplay. A SW-120
          paddle and a SW-105 paddle feel completely different on a drive — the baseline session makes that
          difference visible.
        </p>
      </>
    ),
  },
  {
    n: "04",
    icon: Repeat,
    id: "step-4-kitchen",
    title: "Kitchen — Touch & Control",
    summary: "Dinking, third-shot drops, and resets at the non-volley zone.",
    body: (
      <>
        <p>
          Move to the non-volley line. Run dinking patterns, third-shot drops from the baseline, and reset drills
          where one partner attacks and the other resets back to the kitchen. The questions here are different:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Dwell time</strong> — does the paddle hold the ball long enough to feel placement?</li>
          <li><strong>Plushness</strong> — soft hands or harsh feedback on slow shots?</li>
          <li><strong>Forgiveness</strong> — kitchen mishits are inevitable. Does the paddle still send the ball where you wanted it?</li>
          <li><strong>Reset reliability</strong> — can you take pace off a hard attack and land it short?</li>
        </ul>
        <p className="mt-3">
          Touch-oriented paddles (soft 16mm foam cores, high twist weights, widebody shapes) shine here.
          Stiff power-oriented paddles often struggle — they generate easy power but can feel jumpy on slow
          hands work.
        </p>
      </>
    ),
  },
  {
    n: "05",
    icon: Beaker,
    id: "step-5-transition",
    title: "Transition Zone — Firepower",
    summary: "Rapid mid-court exchanges, hand-speed battles, reset-to-attack sequences.",
    body: (
      <>
        <p>
          Final phase: the chaos zone. Mid-court exchanges, hand-speed battles at the kitchen, and reset-to-attack
          sequences. This is where shape and twist weight matter most — and where bad paddles fall apart.
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Elongated</strong> paddles win on reach but have smaller sweet spots</li>
          <li><strong>Widebody</strong> paddles win on forgiveness but lose reach</li>
          <li><strong>Hybrid</strong> paddles aim for the middle — best when you don&apos;t want to commit to either</li>
        </ul>
        <p className="mt-3">
          This is also where high twist weight becomes the difference between &quot;won that point&quot; and
          &quot;mishit popped up.&quot; Every paddle exits this phase with a clear verdict on whether it earns
          a recommendation, and for whom.
        </p>
      </>
    ),
  },
];

const STYLE_LABELS_EXPLAINER = [
  {
    label: "Power",
    color: "#fb7185",
    body:
      "High swing weight (115+), firm feel, lots of pop on drives. Best for baseline-heavy players who like to impose pace. Trade-off: less plush at the kitchen.",
  },
  {
    label: "Control",
    color: "#60a5fa",
    body:
      "Softer cores (16mm+), longer dwell time, plush on contact. Best for touch-first players who win on the third shot drop. Trade-off: less easy power off the baseline.",
  },
  {
    label: "All-Court",
    color: "#fbbf24",
    body:
      "Balanced specs across the board, no glaring strength or weakness. Best for players who want to grow into one paddle and play every style. The right answer for most buyers.",
  },
  {
    label: "Spin",
    color: "#a78bfa",
    body:
      "Textured face that bites the ball, often paired with a thinner core for ball-pocketing. Best for topspin-heavy players. Trade-off: textures wear, so spin paddles tend to need replacing sooner.",
  },
];

export default function HowWeTestPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl py-20 md:py-28">

          {/* ── HERO ────────────────────────────────────────────────────────── */}
          <div className="max-w-3xl">
            <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4">
              Methodology
            </p>
            <h1
              className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              How We Test
              <br />
              <span style={{ color: "#60a5fa" }}>Pickleball Paddles.</span>
            </h1>
            <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
              Every paddle on this site goes through the same five-step protocol — measured on lab equipment,
              broken in for 10 minutes, then drilled across baseline, kitchen, and transition zones with a
              partner. The goal is to give you the same picture you&apos;d get if you played the paddle for
              an hour yourself.
            </p>
            <p className="text-base leading-relaxed mb-10" style={{ color: "var(--text-muted)" }}>
              This page documents the full process — the equipment we use, what each step is actually looking
              for, and how those findings translate to the verdicts you see on every paddle&apos;s detail page.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/paddles" className="btn-primary text-base px-8 py-4">
                See Every Tested Paddle
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="text-base px-8 py-4 rounded-full font-bold inline-flex items-center gap-2 transition-colors"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                Meet Austin
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ── 5 STEPS ─────────────────────────────────────────────────────── */}
          <div className="mt-24 max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
              The 5-Step Protocol
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-10" style={{ color: "var(--text-primary)" }}>
              From bench to verdict
            </h2>
            <div className="flex flex-col gap-10">
              {steps.map(({ n, icon: Icon, id, title, summary, body }) => (
                <div
                  key={id}
                  id={id}
                  className="rounded-3xl p-6 md:p-8"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(10, 100, 188,0.30)" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: "#60a5fa" }} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "rgba(10, 100, 188,0.7)" }}>
                        Step {n}
                      </p>
                      <h3 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                        {title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                    {summary}
                  </p>
                  <div className="text-base leading-relaxed space-y-3" style={{ color: "var(--text-muted)" }}>
                    {body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── EQUIPMENT ───────────────────────────────────────────────────── */}
          <div className="mt-24 max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
              Equipment
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
              What we use
            </h2>
            <p className="text-lg mb-10" style={{ color: "var(--text-muted)" }}>
              The tools that make objective spec measurement possible — and why each one matters.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Briffidi-style swing weight rig",
                  body: "Measures rotational moment about the hand axis — the single best objective predictor of how a paddle feels in motion. Calibrated to ±0.5 kg·cm² for consistent cross-paddle comparisons.",
                },
                {
                  title: "Calibrated digital gram scale",
                  body: "Captures static weight to the gram. Manufacturers often round or use spec-sheet targets — the scale shows what the paddle actually weighs in your hand.",
                },
                {
                  title: "Twist weight measurement rig",
                  body: "Quantifies resistance to off-center hits. Almost never published by manufacturers, but it's the spec that determines how forgiving a paddle is for everyday players.",
                },
                {
                  title: "Tournament-grade balls + drilling partner",
                  body: "USAP-approved balls so the test conditions match what you'll actually play with. A consistent drilling partner means the same shot mix every session — eliminating one big source of review noise.",
                },
              ].map(({ title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl p-5"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── PLAY STYLES ─────────────────────────────────────────────────── */}
          <div className="mt-24 max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
              Play Style Verdicts
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
              How we classify paddles
            </h2>
            <p className="text-lg mb-10" style={{ color: "var(--text-muted)" }}>
              Every paddle gets tagged with one of four play styles based on its measured specs and on-court behavior.
              This is the tag you see on the detail page — and what most buying decisions come down to.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STYLE_LABELS_EXPLAINER.map(({ label, color, body }) => (
                <div
                  key={label}
                  className="rounded-2xl p-5"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <span
                    className="inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
                    style={{ background: `${color}1f`, color, border: `1px solid ${color}55` }}
                  >
                    {label}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── INTEGRITY ───────────────────────────────────────────────────── */}
          <div className="mt-24 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
              Why this matters
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
              Independence over influence
            </h2>
            <div className="space-y-5 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
              <p>
                The whole point of a methodology is that the next paddle gets treated exactly the same as the
                last one. Brands send paddles. Some buy ad placements on other sites. None of that changes the
                five steps above — or which paddles get a thumbs-up.
              </p>
              <p>
                Full disclosure on affiliate links, sample paddles, and review independence is on the{" "}
                <Link href="/about#editorial-standards" className="font-bold" style={{ color: "#60a5fa" }}>
                  About page&apos;s Editorial Standards section
                </Link>{" "}
                — or read the{" "}
                <Link href="/about" className="font-bold" style={{ color: "#60a5fa" }}>
                  full About page
                </Link>{" "}
                to see who&apos;s actually behind the reviews.
              </p>
            </div>
            <div className="mt-10 p-5 rounded-2xl flex items-start gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <ClipboardList className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#60a5fa" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Have a paddle you want tested? Email through the{" "}
                <Link href="/contact" className="font-bold" style={{ color: "#60a5fa" }}>contact page</Link>{" "}
                — paddle requests from readers go to the top of the queue.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
