"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MemberLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/members";

  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Login failed");
      if (d.must_reset) {
        router.replace("/members/reset-password?must_reset=1");
        return;
      }
      const dest =
        next !== "/members" && next.startsWith("/members/")
          ? next
          : d.bundle_slugs?.length > 0
          ? `/members/${d.bundle_slugs[0]}`
          : "/members/login";
      router.replace(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  async function requestReset() {
    setLoading(true);
    setError("");
    try {
      await fetch("/api/member/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMsg("If that email has an account, a reset link was sent. Check your inbox.");
      setMode("login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 w-full max-w-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Pickleball Drills
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "login" ? "Member Login" : "Reset Password"}
          </h1>
        </div>

        {msg && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 mb-4">
            {msg}
          </div>
        )}

        <input
          type="email"
          placeholder="Email address"
          className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-black/10 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />

        {mode === "login" && (
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-black/10 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
        )}

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={mode === "login" ? login : requestReset}
          disabled={loading || !email || (mode === "login" && !password)}
          className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg text-sm mb-4 transition-colors"
        >
          {loading ? "…" : mode === "login" ? "Sign In" : "Send Reset Link"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "login" ? "reset" : "login");
            setError("");
            setMsg("");
          }}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          {mode === "login" ? "Forgot password?" : "← Back to sign in"}
        </button>
      </div>
    </div>
  );
}
