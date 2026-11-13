"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const mustReset = params.get("must_reset") === "1";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/member/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Reset failed");
      const slug = d.bundle_slugs?.[0];
      router.replace(slug ? `/members/${slug}` : "/members/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
      setLoading(false);
    }
  }

  if (!token && !mustReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center text-gray-500">
          <p className="mb-4">Invalid or missing reset link.</p>
          <a href="/members/login" className="text-black underline">Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 w-full max-w-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Pickleball Drills
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            {mustReset ? "Set Your Password" : "Reset Password"}
          </h1>
          {mustReset && (
            <p className="text-sm text-gray-500 mt-1">
              Set a password to access your drills.
            </p>
          )}
        </div>

        <input
          type="password"
          placeholder="New password (min 8 characters)"
          autoComplete="new-password"
          className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-black/10 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-black/10 text-sm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={submit}
          disabled={loading || !password || !confirm}
          className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
        >
          {loading ? "Saving…" : "Set Password & Sign In"}
        </button>
      </div>
    </div>
  );
}
