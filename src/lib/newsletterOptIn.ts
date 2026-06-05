"use client";

import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { siteConfig } from "@/config/site";

/**
 * newsletterOptIn
 * ---------------
 * Bridges the /login form (where the user picks their opt-in preference)
 * and the post-signin flow (where we persist it + show the Substack
 * one-click subscribe prompt).
 *
 * The opt-in choice lives in localStorage briefly because magic-link
 * sign-in is a round-trip through email — we can't pass state through
 * Supabase's OTP redirect. After successful sign-in, syncPendingOptIn()
 * reads the flag, upserts it to the user's profile, and clears it.
 */

const PENDING_KEY  = "ppb_newsletter_pending";       // "1" | "0"
const DISMISS_KEY  = "ppb_newsletter_banner_seen";   // "1"

// ── Pre-signin: stash the user's choice ───────────────────────────────────
export function setPendingOptIn(optIn: boolean): void {
  try {
    window.localStorage.setItem(PENDING_KEY, optIn ? "1" : "0");
  } catch {
    // noop
  }
}

function readAndClearPendingOptIn(): boolean | null {
  try {
    const v = window.localStorage.getItem(PENDING_KEY);
    if (v === null) return null;
    window.localStorage.removeItem(PENDING_KEY);
    return v === "1";
  } catch {
    return null;
  }
}

// ── Post-signin: write the choice to the profiles row ─────────────────────
export async function syncPendingOptIn(): Promise<void> {
  const pending = readAndClearPendingOptIn();
  if (pending === null) return;

  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return;

  await supabase
    .from("profiles")
    .update({ newsletter_opt_in: pending })
    .eq("id", data.user.id);
}

// ── Banner dismiss state (localStorage; per-browser is fine) ──────────────
export function bannerDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissBanner(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // noop
  }
}

// ── Build the Substack one-click subscribe URL with prefilled email ───────
export function substackSubscribeUrl(email: string): string {
  // siteConfig.substackUrl = "https://pickleballplaybookreviews.substack.com/"
  const base = siteConfig.substackUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    email,
    utm_source: "playbookpaddles",
    utm_medium: "post_signup_prompt",
  });
  return `${base}/subscribe?${params.toString()}`;
}

// ── After user clicks Subscribe: record the timestamp on their profile ────
export async function markSubscribed(): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return;
  await supabase
    .from("profiles")
    .update({ newsletter_subscribed_at: new Date().toISOString() })
    .eq("id", data.user.id);
  dismissBanner();
}
