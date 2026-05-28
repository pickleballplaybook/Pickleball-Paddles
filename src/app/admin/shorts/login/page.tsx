"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ShortsLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin/shorts";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/shorts/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, next }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Failed (${r.status})`);
      router.replace(d.next || next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6">Shorts Generator</h1>
        <input
          type="password"
          placeholder="Enter password"
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-4 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button
          onClick={submit}
          disabled={loading || !password}
          className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-700 text-black font-bold py-3 rounded-lg"
        >
          {loading ? "Checking..." : "Enter"}
        </button>
      </div>
    </div>
  );
}
