"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PlatformIcon } from "../_components/PlatformIcon";

type Connection = {
  id: string;
  platform: "instagram" | "facebook" | "youtube";
  account_id: string;
  account_name: string | null;
  page_id: string | null;
  token_expires_at: string | null;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const message = searchParams.get("message");

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/meta/list");
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const disconnect = async (c: Connection) => {
    if (!confirm(`Disconnect ${c.account_name || c.platform}?`)) return;
    await fetch("/api/auth/meta/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: c.platform, account_id: c.account_id }),
    });
    load();
  };

  const ig = connections.filter((c) => c.platform === "instagram" && c.is_active);
  const fb = connections.filter((c) => c.platform === "facebook" && c.is_active);
  const yt = connections.filter((c) => c.platform === "youtube" && c.is_active);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/auto-reply"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Campaigns
          </Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
        </div>

        {/* Flash message from OAuth callback */}
        {status && message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              status === "ok"
                ? "border-green-800 bg-green-950 text-green-300"
                : "border-red-800 bg-red-950 text-red-300"
            }`}
          >
            {status === "ok" ? "✓ " : "⚠️ "} {message}
          </div>
        )}

        <p className="text-sm text-gray-400">
          Connect your Instagram and Facebook accounts to enable auto-replies.
          One click handles both — Meta lets you authorize the linked Page and
          Instagram account together.
        </p>

        {/* Big primary action */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-start gap-4">
            <div className="flex -space-x-2 shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-fuchsia-500 to-orange-400 flex items-center justify-center ring-2 ring-gray-900">
                <PlatformIcon platform="instagram" className="h-5 w-5 text-white" />
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-gray-900">
                <PlatformIcon platform="facebook" className="h-5 w-5 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h2 className="font-semibold">Instagram + Facebook</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Authorize via Facebook Login. We&apos;ll automatically connect any
                linked Pages and IG Business accounts.
              </p>
            </div>

            <a
              href="/api/auth/meta/start"
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded-xl text-sm shrink-0"
            >
              {ig.length + fb.length === 0 ? "Connect" : "Reconnect"}
            </a>
          </div>
        </div>

        {/* Connected accounts */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Connected ({ig.length + fb.length})
          </h3>

          {loading ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-500">
              Loading…
            </div>
          ) : ig.length + fb.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900 p-6 text-sm text-gray-500">
              No accounts connected yet. Click <strong>Connect</strong> above to
              get started.
            </div>
          ) : (
            <ul className="space-y-2">
              {[...fb, ...ig].map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex items-center gap-4"
                >
                  <PlatformIcon platform={c.platform} className="h-5 w-5 text-gray-300" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {c.account_name || c.account_id}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">
                        {c.platform}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      ID: {c.account_id}
                      {c.token_expires_at && (
                        <>
                          {" · expires "}
                          {new Date(c.token_expires_at).toLocaleDateString()}
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => disconnect(c)}
                    className="text-xs font-medium text-gray-400 hover:text-red-400"
                  >
                    Disconnect
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <PlatformIcon platform="youtube" className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">YouTube</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Authorize via Google OAuth. To add a second channel, click
                below — Google will show an account/channel picker.
              </p>
            </div>
            <a
              href="/api/auth/youtube/start"
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded-xl text-sm shrink-0"
            >
              {yt.length === 0 ? "Connect" : "Add channel"}
            </a>
          </div>
        </div>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            YouTube channels ({yt.length})
          </h3>
          {loading ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-500">
              Loading…
            </div>
          ) : yt.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900 p-6 text-sm text-gray-500">
              No YouTube channels connected. Click <strong>Connect</strong> above.
            </div>
          ) : (
            <ul className="space-y-2">
              {yt.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex items-center gap-4"
                >
                  <PlatformIcon platform={c.platform} className="h-5 w-5 text-gray-300" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {c.account_name || c.account_id}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">
                        {c.platform}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      ID: {c.account_id}
                      {c.token_expires_at && (
                        <>
                          {" · expires "}
                          {new Date(c.token_expires_at).toLocaleDateString()}
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => disconnect(c)}
                    className="text-xs font-medium text-gray-400 hover:text-red-400"
                  >
                    Disconnect
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
