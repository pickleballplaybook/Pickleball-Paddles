"use client";

import { useEffect, useState } from "react";

/**
 * Subscribe modal for The Playbook newsletter.
 *
 * Styled after The Dink's popup — half-viewport overlay with an X to
 * dismiss, big headline ("Get Smarter About Pickleball"), and a single
 * email field that posts to Substack's public subscribe form.
 *
 * Show rules:
 *   - Only on /pickleball-101 and its post pages (mount site-wide is fine,
 *     the parent decides where to render).
 *   - Session-scoped: once dismissed OR subscribed, don't reappear until
 *     the user opens a new tab. Uses sessionStorage flag PB_MODAL_SEEN.
 *   - Delay 3s after mount so it doesn't slam the reader before they've
 *     started reading the article.
 */

const SESSION_KEY = "pb_playbook_modal_seen";
const SUBSTACK_ACTION = "https://pickleballplaybook.substack.com/api/v1/free";
const SUBSTACK_HOME = "https://pickleballplaybook.substack.com";

export default function PlaybookSubscribeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* Safari private mode etc — fall through and show anyway */
    }
    const t = window.setTimeout(() => setOpen(true), 3000);
    return () => window.clearTimeout(t);
  }, []);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pb-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 10, 15, 0.6)",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
      onClick={(e) => {
        // Click on the backdrop (not the card) dismisses.
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 560,
          background: "#FFFFFF",
          borderRadius: 20,
          padding: "44px 28px 32px",
          boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.35)",
          textAlign: "center",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 999,
            border: "none",
            background: "#F3F4F6",
            color: "#0A0A0F",
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <h2
          id="pb-modal-title"
          style={{
            fontSize: 28,
            lineHeight: 1.15,
            fontWeight: 800,
            color: "#0A0A0F",
            margin: "0 0 14px",
          }}
        >
          Get Smarter About{" "}
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            Pickleball
          </span>
        </h2>
        <p style={{ fontSize: 15, color: "#4B5563", margin: "0 0 24px" }}>
          Join subscribers getting weekly pickleball tips, drills, and strategy
          — 5-minute reads on what matters. Free forever.
        </p>

        {/* Native Substack subscribe form — POSTs to their public endpoint.
            Substack redirects to /subscribe/confirm on success, so we hand
            the browser off there rather than trying to intercept the
            response (their CORS blocks fetch, so a real form submit is
            the reliable path). */}
        <form
          action={SUBSTACK_ACTION}
          method="POST"
          target="_blank"
          onSubmit={() => {
            // Fire-and-forget: mark seen so they don't get the modal again
            // on the next page load.
            try {
              sessionStorage.setItem(SESSION_KEY, "1");
            } catch {
              /* ignore */
            }
          }}
          style={{
            display: "flex",
            gap: 8,
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <input
            type="email"
            name="email"
            required
            placeholder="Enter your email"
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              fontSize: 15,
              color: "#0A0A0F",
              outline: "none",
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            style={{
              padding: "14px 22px",
              borderRadius: 10,
              border: "none",
              background: "#0A0A0F",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Subscribe Free
          </button>
        </form>

        <p
          style={{
            fontSize: 12,
            color: "#9CA3AF",
            margin: "16px 0 0",
          }}
        >
          No spam. Unsubscribe anytime.{" "}
          <a
            href={SUBSTACK_HOME}
            target="_blank"
            rel="noopener"
            style={{ color: "#6B7280", textDecoration: "underline" }}
          >
            Visit The Playbook →
          </a>
        </p>
      </div>
    </div>
  );
}
