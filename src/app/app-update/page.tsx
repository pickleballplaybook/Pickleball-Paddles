import Image from "next/image";
import type { Metadata } from "next";
import { UpdateButton } from "./UpdateButton";
import "./styles.css";

export const metadata: Metadata = {
  title: "What's New — Pickleball Drills App",
  description:
    "Community. AI Drills. Lessons. Court Finder. Direct Messaging. The biggest Pickleball Drills update ever just dropped — update your app to get all 5.",
};

const TEAL = "#3cacae";
const TEAL_DIM = "rgba(60,172,174,0.12)";
const TEAL_GLOW = "rgba(60,172,174,0.22)";
const WHITE_DIM = "rgba(255,255,255,0.55)";

const FEATURES = [
  {
    number: "01",
    eyebrow: "Community",
    headline: "24/7 Access to the Drills Community",
    bullets: [
      "17,000+ members sharing wins, reps, and real feedback",
      "Monthly challenges with accountability built in",
      "Pinned guides and announcements from coaches",
      "Live member count so you know who's online",
    ],
    image: "/images/app-update/screen-1.png",
    alt: "Community tab in the Pickleball Drills app",
  },
  {
    number: "02",
    eyebrow: "AI Drills",
    headline: "Drills to Help You Reach the Next Level",
    bullets: [
      "AI Drill Finder picks the perfect drill for your game right now",
      "Serve, reset, dink, drive, drop, volley, and solo (wall or ball machine)",
      "Video-guided reps with step-by-step coaching breakdowns",
      "New drills added every month",
    ],
    image: "/images/app-update/screen-2.png",
    alt: "Drills tab with AI Drill Finder in the Pickleball Drills app",
  },
  {
    number: "03",
    eyebrow: "Lessons",
    headline: "Lessons That Unlock as You Level Up",
    bullets: [
      "Technique Masterclass covers every shot in pickleball",
      "Progressive unlock system — earn your way to advanced content",
      "Step-by-step breakdowns so every shot becomes automatic",
      "Starts unlocking at Level 3 — you're earning XP from day one",
    ],
    image: "/images/app-update/screen-3.png",
    alt: "Lessons tab showing Technique Masterclass",
  },
  {
    number: "04",
    eyebrow: "Court Finder",
    headline: "Find Courts & Players Anytime, Anywhere",
    bullets: [
      "Real-time map of courts near you with live players",
      "See who's available and when they're out there drilling",
      "Add your home court to the community network",
      "Privacy-first: your pin is only shown within 10 miles",
    ],
    image: "/images/app-update/screen-4.png",
    alt: "Court finder map showing nearby pickleball courts",
  },
  {
    number: "05",
    eyebrow: "Direct Messaging",
    headline: "Meet New Drilling Partners",
    bullets: [
      "Direct message any community member instantly",
      "Coordinate drill sessions and court times in seconds",
      "Share clips, scores, and post-session breakdowns",
      "Build your local pickleball network one message at a time",
    ],
    image: "/images/app-update/screen-5.png",
    alt: "Direct messaging chat feature in the Pickleball Drills app",
  },
];

const MARQUEE_ITEMS = [
  "Community", "AI Drill Finder", "Lessons", "Court Finder",
  "Direct Messaging", "Community", "AI Drill Finder", "Lessons",
  "Court Finder", "Direct Messaging", "Community", "AI Drill Finder",
];

export default function AppUpdatePage() {
  return (
    <div style={{ background: "#000", color: "#fff", overflowX: "hidden" }}>

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 100px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `radial-gradient(${TEAL_GLOW.replace("0.22", "0.18")} 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)",
        }} />

        {/* Central glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 55% 45% at 50% 55%, ${TEAL_GLOW} 0%, transparent 70%)`,
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "700px" }}>
          {/* Badge */}
          <div className="pb-fade-up" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: TEAL_DIM,
            border: `1px solid rgba(60,172,174,0.35)`,
            borderRadius: "100px", padding: "7px 18px", marginBottom: "36px",
          }}>
            <span style={{
              color: TEAL, fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              🎉 &nbsp;Major Update — 5 New Features
            </span>
          </div>

          {/* Headline */}
          <h1 className="pb-fade-up pb-delay-100" style={{
            fontSize: "clamp(56px, 11vw, 104px)",
            fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 0.98,
            margin: "0 0 28px",
          }}>
            <span style={{
              display: "block",
              background: "linear-gradient(160deg, #fff 30%, rgba(255,255,255,0.7) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              The App Just
            </span>
            <span style={{
              display: "block",
              background: `linear-gradient(135deg, #fff 0%, ${TEAL} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Got Revamped.
            </span>
          </h1>

          {/* Sub */}
          <p className="pb-fade-up pb-delay-200" style={{
            fontSize: "clamp(16px, 2.2vw, 19px)",
            color: WHITE_DIM, lineHeight: 1.65,
            margin: "0 auto 52px",
            maxWidth: "480px",
          }}>
            Community. AI Drills. Lessons. Court Finder. Direct Messaging.
            Five brand-new features just dropped — all in one update.
          </p>

          {/* CTA */}
          <div className="pb-fade-up pb-delay-300" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <UpdateButton />
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
              Available on the App Store
            </p>
          </div>

          {/* Stats row */}
          <div className="pb-fade-up pb-delay-500" style={{
            display: "flex", gap: "clamp(24px, 5vw, 56px)",
            justifyContent: "center", marginTop: "64px",
          }}>
            {[["17K+", "Members"], ["150+", "Drills"], ["5", "New Features"]].map(([num, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{num}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "4px" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: "absolute", bottom: "32px", left: "50%",
          transform: "translateX(-50%)", display: "flex",
          flexDirection: "column", alignItems: "center", gap: "8px", opacity: 0.35,
        }}>
          <span style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: "1px", height: "36px", background: `linear-gradient(to bottom, rgba(255,255,255,0.7), transparent)` }} />
        </div>
      </section>

      {/* ─── MARQUEE ───────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 0", overflow: "hidden", background: "#000",
      }}>
        <div className="pb-marquee-track" style={{ display: "flex", gap: "0" }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{
              whiteSpace: "nowrap", padding: "0 32px",
              fontSize: "13px", fontWeight: 600,
              color: i % 2 === 0 ? TEAL : "rgba(255,255,255,0.25)",
              letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              {item}
              <span style={{ marginLeft: "32px", color: "rgba(60,172,174,0.25)" }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── FEATURE SECTIONS ──────────────────────────────────────────────── */}
      {FEATURES.map((f, i) => {
        const flip = i % 2 === 1;
        return (
          <section key={f.number} style={{
            minHeight: "100vh", display: "flex", alignItems: "center",
            padding: "100px 5vw",
            background: i % 2 === 0 ? "#000" : "#030303",
            position: "relative", overflow: "hidden",
          }}>
            {/* Ambient glow on image side */}
            <div style={{
              position: "absolute",
              [flip ? "right" : "left"]: "0",
              top: "50%", transform: "translateY(-50%)",
              width: "45%", height: "90%",
              background: `radial-gradient(ellipse at ${flip ? "right" : "left"} center, rgba(60,172,174,0.07) 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />

            {/* Watermark number */}
            <div style={{
              position: "absolute",
              [flip ? "left" : "right"]: "-1%",
              top: "50%", transform: "translateY(-50%)",
              fontSize: "clamp(180px, 24vw, 320px)",
              fontWeight: 900,
              color: "rgba(255,255,255,0.018)",
              letterSpacing: "-0.06em", lineHeight: 1,
              pointerEvents: "none", userSelect: "none",
            }}>
              {f.number}
            </div>

            <div
              className="pb-feature-row"
              style={{
                maxWidth: "1160px", margin: "0 auto", width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "clamp(40px, 7vw, 110px)",
                flexDirection: flip ? "row-reverse" : "row",
                position: "relative", zIndex: 1,
              }}
            >
              {/* ── Text ── */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Eyebrow */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
                  <div style={{ width: "28px", height: "1.5px", background: TEAL, borderRadius: "2px" }} />
                  <span style={{
                    color: TEAL, fontSize: "11px", fontWeight: 700,
                    letterSpacing: "0.18em", textTransform: "uppercase",
                  }}>
                    {f.number} — {f.eyebrow}
                  </span>
                </div>

                {/* Headline */}
                <h2 style={{
                  fontSize: "clamp(30px, 4vw, 52px)",
                  fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1.1,
                  margin: "0 0 36px", color: "#fff",
                }}>
                  {f.headline}
                </h2>

                {/* Bullets */}
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                  {f.bullets.map((b) => (
                    <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                      <div style={{
                        width: "20px", height: "20px", borderRadius: "50%",
                        background: TEAL_DIM,
                        border: `1px solid rgba(60,172,174,0.3)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, marginTop: "2px",
                      }}>
                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: TEAL }} />
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.62)", fontSize: "16px", lineHeight: 1.65 }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── Phone ── */}
              <div style={{
                flexShrink: 0,
                width: "clamp(210px, 26vw, 300px)",
                position: "relative",
              }}>
                <div
                  className="pb-phone-float"
                  style={{
                    borderRadius: "28px", overflow: "hidden",
                    boxShadow: `0 0 70px ${TEAL_GLOW}, 0 0 140px rgba(60,172,174,0.07), 0 40px 80px rgba(0,0,0,0.85)`,
                  }}
                >
                  <Image
                    src={f.image}
                    alt={f.alt}
                    width={630}
                    height={1120}
                    style={{ display: "block", width: "100%", height: "auto" }}
                  />
                </div>
                {/* NEW badge */}
                <div style={{
                  position: "absolute", top: "-10px", right: "-10px",
                  background: `linear-gradient(135deg, ${TEAL} 0%, #239a9c 100%)`,
                  color: "#000", fontWeight: 800, fontSize: "10px",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  padding: "5px 11px", borderRadius: "100px",
                  boxShadow: `0 4px 18px ${TEAL_GLOW}`,
                }}>
                  NEW
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ─── DIVIDER ───────────────────────────────────────────────────────── */}
      <div style={{
        height: "1px",
        background: `linear-gradient(to right, transparent, rgba(60,172,174,0.3), transparent)`,
        margin: "0",
      }} />

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "65vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "110px 24px",
        position: "relative", overflow: "hidden", background: "#000",
      }}>
        {/* Radial glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(60,172,174,0.09) 0%, transparent 70%)`,
        }} />

        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `radial-gradient(rgba(60,172,174,0.12) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, black 20%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, black 20%, transparent 100%)",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "600px" }}>
          <p style={{
            color: TEAL, fontSize: "11px", fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "20px",
          }}>
            It&apos;s All Waiting in Your App
          </p>

          <h2 style={{
            fontSize: "clamp(48px, 9vw, 88px)",
            fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.0,
            margin: "0 0 20px",
            background: "linear-gradient(160deg, #fff 40%, rgba(255,255,255,0.65) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Update Now.
          </h2>

          <p style={{
            color: WHITE_DIM, fontSize: "17px", lineHeight: 1.65,
            marginBottom: "52px", maxWidth: "380px", marginLeft: "auto", marginRight: "auto",
          }}>
            Open the App Store or Google Play, search <strong style={{ color: "rgba(255,255,255,0.8)" }}>Pickleball Drills</strong>, and tap Update.
          </p>

          <UpdateButton large />

          {/* Feature pills */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "10px",
            justifyContent: "center", marginTop: "48px",
          }}>
            {["Community", "AI Drill Finder", "Lessons", "Court Finder", "Direct Messaging"].map((name) => (
              <span key={name} style={{
                display: "inline-block", padding: "6px 14px",
                borderRadius: "100px", fontSize: "12px", fontWeight: 600,
                background: TEAL_DIM,
                border: `1px solid rgba(60,172,174,0.25)`,
                color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em",
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "28px 24px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#000",
      }}>
        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.2)" }}>
          © 2026 Pickleball Drills &nbsp;·&nbsp; playbookpaddles.com
        </span>
      </div>

    </div>
  );
}
