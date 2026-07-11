"use client";

import { useState } from "react";
import { Mail, X, ExternalLink } from "lucide-react";
import { dismissBanner, markSubscribed, substackSubscribeUrl } from "@/lib/newsletterOptIn";

interface Props {
  email: string;
  onDismiss: () => void;
}

/**
 * NewsletterConfirmBanner
 * -----------------------
 * Shown on /match/history after a user signs in if they opted into the
 * newsletter on /login. Substack doesn't allow programmatic subscriber
 * adds, so this is the closest we can get to "1-click subscribe" — the
 * link opens Substack with the email pre-filled via URL param.
 *
 * State machine:
 *   1. Render banner
 *   2. User clicks "Confirm subscription" → opens Substack in new tab,
 *      marks subscribed timestamp on profile, dismisses banner
 *   3. User clicks X → just dismisses (no DB write — they'll show up in
 *      the admin CSV export as opted-in but not yet confirmed)
 */
export default function NewsletterConfirmBanner({ email, onDismiss }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleSubscribe() {
    setBusy(true);
    // Open Substack first so the click is registered as a user gesture
    // (some browsers block window.open after async work).
    window.open(substackSubscribeUrl(email), "_blank", "noopener,noreferrer");
    await markSubscribed();
    onDismiss();
  }

  function handleDismiss() {
    dismissBanner();
    onDismiss();
  }

  return (
    <div
      className="rounded-2xl px-5 py-4 mb-6 flex items-start gap-3 relative"
      style={{
        background: "linear-gradient(135deg, rgba(10, 100, 188,0.30) 0%, rgba(10, 100, 188,0.19) 100%)",
        border: "1px solid rgba(10, 100, 188,0.35)",
      }}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: "rgba(10, 100, 188,0.30)" }}
      >
        <Mail className="w-5 h-5" style={{ color: "#60a5fa" }} />
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
          One last step — confirm your newsletter subscription
        </p>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Substack handles the actual subscription. Click below and your email ({email}) will be
          pre-filled — one tap to confirm.
        </p>
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: "#0a64bc", color: "#0a1628" }}
        >
          Confirm subscription <ExternalLink className="w-3 h-3" />
        </button>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 w-7 h-7 inline-flex items-center justify-center rounded-lg transition-colors hover:text-red-500"
        style={{ color: "var(--text-muted)" }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
