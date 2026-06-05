"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2, Check, ArrowRight, AlertCircle } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/match/history";
  const initialError = searchParams.get("error");

  const [email,       setEmail]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [magicSent,   setMagicSent]   = useState(false);
  const [googleBusy,  setGoogleBusy]  = useState(false);
  const [error,       setError]       = useState<string | null>(initialError);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (err) {
        setError(err.message);
        return;
      }
      setMagicSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send magic link.");
    } finally {
      setSending(false);
    }
  }

  async function signInWithGoogle() {
    setGoogleBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (err) {
        setError(err.message);
        setGoogleBusy(false);
      }
      // On success, browser is redirected to Google — no need to setBusy(false).
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
      setGoogleBusy(false);
    }
  }

  return (
    <div
      className="rounded-3xl p-7 md:p-9"
      style={{
        background:
          "linear-gradient(135deg, rgba(60,172,174,0.06) 0%, var(--flip-bg-card) 50%, var(--flip-bg-card) 100%)",
        border: "1px solid rgba(60,172,174,0.18)",
        boxShadow:
          "0 12px 40px rgba(60,172,174,0.06), 0 2px 8px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
        Sign in
      </p>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
        Save your match history
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Sign in to keep your match analyses across devices. Your data is private and only visible to you.
      </p>

      {error && (
        <div
          className="rounded-xl px-4 py-3 mb-4 text-sm flex items-start gap-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {magicSent ? (
        <div
          className="rounded-xl px-4 py-5 text-center"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.35)" }}
        >
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-2" style={{ background: "rgba(34,197,94,0.15)" }}>
            <Check className="w-5 h-5" style={{ color: "#22c55e" }} strokeWidth={3} />
          </div>
          <p className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>Check your email</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            We sent a magic sign-in link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>. Click it to finish signing in.
          </p>
          <button
            type="button"
            onClick={() => setMagicSent(false)}
            className="mt-4 text-xs font-semibold transition-colors hover:text-teal-400"
            style={{ color: "var(--text-muted)" }}
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          {/* Google */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleBusy}
            className="w-full inline-flex items-center justify-center gap-2.5 font-bold text-sm py-3 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 mb-4"
            style={{
              background: "var(--btn-buy-bg)",
              color: "var(--btn-buy-text)",
              boxShadow: "var(--btn-buy-shadow)",
            }}
          >
            {googleBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to Google…
              </>
            ) : (
              <>
                <GoogleIcon className="w-4 h-4" />
                Continue with Google
              </>
            )}
          </button>

          <div className="relative my-5 flex items-center" aria-hidden>
            <span className="flex-1 h-px" style={{ background: "var(--flip-card-border)" }} />
            <span className="px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>or</span>
            <span className="flex-1 h-px" style={{ background: "var(--flip-card-border)" }} />
          </div>

          {/* Magic link */}
          <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 transition-colors"
              style={{
                background: "var(--flip-bg-card)",
                border: "1px solid var(--flip-card-border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="inline-flex items-center justify-center gap-2 font-bold text-sm py-3 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "var(--flip-bg-card)",
                border: "1px solid var(--flip-card-border)",
                color: "var(--text-primary)",
              }}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending magic link…
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" /> Send magic link
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </>
      )}

      <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>
        By signing in you agree to keep playing pickleball. That&apos;s it. No spam, no marketing.
      </p>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.89-1.741 2.982-4.305 2.982-7.351z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H3.064v2.591A9.996 9.996 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.405 13.9A6 6 0 0 1 6.09 12c0-.66.114-1.301.314-1.9V7.509H3.064A9.996 9.996 0 0 0 2 12c0 1.614.386 3.14 1.064 4.491L6.405 13.9z" />
      <path fill="#EA4335" d="M12 5.977c1.47 0 2.787.505 3.823 1.496l2.868-2.868C16.96 2.99 14.695 2 12 2A9.996 9.996 0 0 0 3.064 7.509L6.405 10.1C7.19 7.737 9.395 5.977 12 5.977z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-12 max-w-md mx-auto">
        <Suspense
          fallback={
            <div className="rounded-3xl p-9 text-center" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
              <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: "var(--text-muted)" }} />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
        <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>
          <Link href="/match/analysis" className="hover:text-teal-400 transition-colors">
            ← Back to the tally sheet
          </Link>
        </p>
      </div>
    </div>
  );
}
