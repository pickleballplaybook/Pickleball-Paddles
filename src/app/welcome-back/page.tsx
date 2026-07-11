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

// $59.80 is the actual amount Stripe charges (80% off $299 = $59.80),
// not $60. Display matches checkout so users don't get "$60 here,
// $59.80 there" friction at the moment of payment.
const COMEBACK_PRICE_DISPLAY = "59.80";
const COMEBACK_PRICE_NUMERIC = 59.8;
const ORIGINAL_PRICE_DISPLAY = "299";
const PERCENT_OFF = 80;
// Per-month framing lands at $4.98 — small, impulsive, and reads more
// like a real subscription than the pennies-per-day framing does at
// 80% off. Switched from per-day 2026-07-02 after Austin's read.
// $59.80 / 12 = $4.9833, rounded to $4.98 for honesty.
const MONTHLY_EQUIVALENT = (COMEBACK_PRICE_NUMERIC / 12).toFixed(2);

export default function ComebackPage() {
  const params = useSearchParams();
  const email = (params.get("t") || "").trim().toLowerCase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mobile detection so the mobile layout can match Cal AI's mobile
  // (larger badge, more top spacing, no strikethrough price row)
  // without breaking the desktop version — those two viewports get
  // different visual weights on purpose.
  const [isMobile, setIsMobile] = useState(false);

  // Hide the global body scroll while the overlay is mounted so the
  // hidden playbookpaddles.com chrome doesn't leak in on long pages.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
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
        // Prefer the friendly `message` (e.g. the "already_subscribed" copy
        // from the dupe-sub guard) over the machine-readable `error` code.
        setError(
          data.message ||
            data.error ||
            "Couldn't start checkout. Email austin@pickleballplaybook.app for help.",
        );
        setLoading(false);
        return;
      }
      // Open Stripe Checkout in a new tab so the offer page stays open
      // in the background. If the user bounces out of checkout we haven't
      // lost the entry point — they can come back and try again.
      window.open(data.url, "_blank", "noopener");
      setLoading(false);
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
          // Mobile: 80px top for headroom, generous but leaves enough
          // vertical room for the whole page to fit in one viewport.
          // Desktop stays tight at 48px.
          padding: isMobile ? "80px 24px 40px" : "48px 24px 60px",
          fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Headline — 28px on mobile keeps "Too expensive? We get it."
            on ONE line at 375px iPhone widths. Desktop stays at 32px. */}
        <h1
          style={{
            fontSize: isMobile ? 28 : 32,
            lineHeight: 1.15,
            fontWeight: 800,
            margin: isMobile ? "0 0 48px" : "0 0 56px",
            color: "#0A0A0F",
          }}
        >
          Too expensive? We get it.
        </h1>

        {/* The star-decorated discount badge. Mobile: sized to match
            Cal AI so the entire page (headline + badge + warning + card
            + CTA + skip link) fits in one viewport without scrolling.
            Desktop: keeps the wider variant to pair with the strikethrough
            price row below it. */}
        <div
          style={{
            position: "relative",
            margin: "0 auto 32px",
            width: "100%",
            maxWidth: isMobile ? 300 : 360,
          }}
        >
          {/* Sparkle decorations */}
          <Sparkle style={{ top: -14, left: -6, fontSize: isMobile ? 24 : 28 }} />
          <Sparkle style={{ top: 26, left: -22, fontSize: isMobile ? 16 : 18 }} />
          <Sparkle style={{ bottom: -10, right: 48, fontSize: isMobile ? 22 : 24 }} />
          <Sparkle style={{ top: -6, right: 10, fontSize: isMobile ? 20 : 22 }} />
          <Sparkle style={{ bottom: 6, right: -12, fontSize: isMobile ? 22 : 26 }} />

          <div
            style={{
              background: "#0A0A0F",
              color: "#FFFFFF",
              borderRadius: 22,
              padding: isMobile ? "32px 24px" : "32px 28px",
              textAlign: "center",
              border: "3px solid #FFFFFF",
              boxShadow: "0 10px 32px rgba(10, 10, 15, 0.22)",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: isMobile ? 48 : 52,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: -1,
                marginBottom: isMobile ? 10 : 10,
              }}
            >
              {PERCENT_OFF}% OFF
            </div>
            <div
              style={{
                fontSize: isMobile ? 14 : 16,
                fontWeight: 700,
                letterSpacing: isMobile ? 5 : 5,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              FOREVER
            </div>
          </div>
        </div>

        {/* Strikethrough + monthly framing — desktop only. Cal AI's
            mobile skips this row (badge flows straight into the urgency
            line), so we match that on mobile too. */}
        {!isMobile && (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 10,
              marginTop: 24,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#0A0A0F",
                textDecoration: "line-through",
                textDecorationThickness: "2px",
              }}
            >
              ${ORIGINAL_PRICE_DISPLAY}
            </span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#0A0A0F" }}>
              ${MONTHLY_EQUIVALENT}/month
            </span>
          </div>
        )}

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
          {/* Black outline triangle (U+26A0 with variation selector 15
              suppresses the yellow emoji rendering — matches Cal AI's
              strict monochrome look). */}
          <span style={{ fontSize: 18, color: "#0A0A0F" }}>⚠︎</span>
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
                ${MONTHLY_EQUIVALENT}/mo
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

        {/* Disclosure removed 2026-07-02: coupon is `duration: forever`
            so renewal price = shown price. No legal need to disclose a
            price change since there is no price change. Matches Cal AI's
            no-fine-print layout. */}
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
