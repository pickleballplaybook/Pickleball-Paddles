"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * /welcome-back?t=<email>
 * -----------------------
 * Cal AI Superwall-style win-back page. Pixel-leaning copy of the
 * cal-ai.superwall.app/v2/paywall flow that the user shared. Rendered
 * as a full-viewport white overlay (position: fixed) so we sidestep
 * the playbookpaddles.com nav + footer entirely without needing a
 * Next.js route group.
 *
 * Single CTA, no plan picker. Always funnels to Pro Annual at the
 * comeback price via /api/comeback-checkout (uses STRIPE_COMEBACK_COUPON_ID).
 */

// $149.50 is the actual amount Stripe charges (50% off $299 = $149.50),
// not $149. Display matches checkout so users don't get "$149 here,
// $149.50 there" friction at the moment of payment.
const COMEBACK_PRICE_DISPLAY = "149.50";
const COMEBACK_PRICE_NUMERIC = 149.5;
const PERCENT_OFF = 50;
// Per-day framing makes the price feel small and impulsive — Cal AI,
// Headspace, and Calm all use this pattern on their checkout pages.
// $149.50 / 365 = $0.4095, rounded to $0.41 for honesty.
const DAILY_EQUIVALENT = (COMEBACK_PRICE_NUMERIC / 365).toFixed(2);

export default function ComebackPage() {
  const params = useSearchParams();
  const email = (params.get("t") || "").trim().toLowerCase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hide the global body scroll while the overlay is mounted so the
  // hidden playbookpaddles.com chrome doesn't leak in on long pages.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function claimDiscount() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/comeback-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Couldn't start checkout. Email austin@pickleballplaybook.app for help.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError("Couldn't reach checkout. Try again or email austin@pickleballplaybook.app.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#FFFFFF",
        color: "#0A0A0F",
        overflowY: "auto",
        zIndex: 99999,
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "48px 24px 60px",
          fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontSize: 32,
            lineHeight: 1.15,
            fontWeight: 800,
            margin: "0 0 56px",
            color: "#0A0A0F",
          }}
        >
          Too expensive? We get it.
        </h1>

        {/* The big star-decorated discount badge — the visual anchor */}
        <div style={{ position: "relative", margin: "0 auto 36px", width: "100%", maxWidth: 360 }}>
          {/* Sparkle decorations */}
          <Sparkle style={{ top: -18, left: -8, fontSize: 28 }} />
          <Sparkle style={{ top: 32, left: -28, fontSize: 18 }} />
          <Sparkle style={{ bottom: -12, right: 60, fontSize: 24 }} />
          <Sparkle style={{ top: -8, right: 12, fontSize: 22 }} />
          <Sparkle style={{ bottom: 8, right: -16, fontSize: 26 }} />

          <div
            style={{
              background: "#1A1F2E",
              color: "#FFFFFF",
              borderRadius: 24,
              padding: "44px 28px",
              textAlign: "center",
              border: "3px solid #FFFFFF",
              boxShadow: "0 12px 40px rgba(26, 31, 46, 0.18)",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: -1,
                marginBottom: 8,
              }}
            >
              {PERCENT_OFF}% OFF
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 4,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              ANNUAL
            </div>
          </div>
        </div>

        {/* Urgency warning */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            margin: "32px 0 20px",
            color: "#444",
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span>This offer won't be there once you close it!</span>
        </div>

        {/* Price card */}
        <div
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: "#1A1F2E",
              color: "#FFFFFF",
              textAlign: "center",
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1.5,
            }}
          >
            LOWEST PRICE EVER
          </div>
          <div
            style={{
              padding: "20px 22px",
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0A0A0F" }}>Yearly</div>
              <div style={{ fontSize: 16, color: "#6B7280", marginTop: 4, fontWeight: 500 }}>
                12mo · ${COMEBACK_PRICE_DISPLAY}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0A0A0F", lineHeight: 1 }}>
                ${DAILY_EQUIVALENT}/day
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
                that's all
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={claimDiscount}
          disabled={loading || !email}
          style={{
            width: "100%",
            background: loading ? "#3A3D4A" : "#1A1F2E",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 100,
            padding: "20px 24px",
            fontSize: 17,
            fontFamily: "Poppins, sans-serif",
            fontWeight: 800,
            letterSpacing: 0.5,
            cursor: loading || !email ? "not-allowed" : "pointer",
            opacity: !email ? 0.5 : 1,
          }}
        >
          {loading
            ? "Sending to checkout…"
            : !email
              ? "OPEN FROM YOUR EMAIL TO CLAIM"
              : "CLAIM YOUR ONE TIME OFFER"}
        </button>

        {/* Skip "link" — intentionally NOT clickable. It's there as a
            visual reminder that they have an opt-out, but the only way to
            actually skip is to close the tab or browse away. Removing the
            click handler makes the choice feel more deliberate (and is
            the Cal AI pattern). */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "#9CA3AF",
            fontSize: 15,
            fontWeight: 500,
            padding: "10px",
            userSelect: "none",
          }}
        >
          Skip the savings and cancel
        </div>

        {/* Error toast */}
        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "#FEE2E2",
              color: "#991B1B",
              borderRadius: 12,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Legal-required renewal disclosure — required so we don't get
            charged with deceptive billing. Kept small + at the bottom
            like Cal AI does, so it doesn't compete with the offer. */}
        <p
          style={{
            marginTop: 40,
            fontSize: 10,
            lineHeight: 1.5,
            color: "#9CA3AF",
            textAlign: "center",
          }}
        >
          Subscription renews at $299/year after the first year unless cancelled.
          Cancel anytime from your account. Linked to {email || "your email"}.
        </p>
      </div>
    </div>
  );
}

function Sparkle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        color: "#1A1F2E",
        fontWeight: 900,
        userSelect: "none",
        pointerEvents: "none",
        ...style,
      }}
    >
      ✦
    </div>
  );
}
