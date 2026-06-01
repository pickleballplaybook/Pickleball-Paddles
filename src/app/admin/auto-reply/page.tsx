"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CampaignCard } from "./_components/CampaignCard";
import { ConnectionStatus } from "./_components/ConnectionStatus";
import type { Campaign } from "./_components/types";
import { AdminNav } from "../_components/AdminNav";

export default function AutoReplyAdminPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  useEffect(() => {
    const safeFetch = async (url: string) => {
      try {
        const r = await fetch(url);
        if (!r.ok) return { error: `${r.status} ${r.statusText}` };
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          return { error: `endpoint returned ${ct || "non-JSON"} (likely 404)` };
        }
        return await r.json();
      } catch (e: any) {
        return { error: e.message };
      }
    };

    Promise.all([
      safeFetch("/api/admin/auto-reply/campaigns"),
      safeFetch("/api/admin/auto-reply/connections"),
    ])
      .then(([campData, connData]) => {
        if (campData.error) {
          setError(`Couldn't load campaigns: ${campData.error}`);
        } else {
          setCampaigns(campData.campaigns || []);
        }
        if (!connData.error) {
          setConnections(connData.connections || []);
        }
        // Connection load failure is non-fatal - just leave empty.
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = campaigns.filter((c) => {
    if (filter === "active") return c.is_active;
    if (filter === "paused") return !c.is_active;
    return true;
  });

  const toggleActive = async (id: string) => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return;
    const newActive = !campaign.is_active;

    // Optimistic update
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: newActive } : c))
    );

    const res = await fetch(`/api/admin/auto-reply/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newActive }),
    });
    if (!res.ok) {
      // Revert on failure
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !newActive } : c))
      );
      const data = await res.json().catch(() => ({}));
      alert(`Failed to toggle: ${data?.error || res.statusText}`);
    }
  };

  const deleteCampaign = async (id: string) => {
    const c = campaigns.find((x) => x.id === id);
    const label = c?.name || "this campaign";
    if (
      !confirm(
        `Delete "${label}"? This removes the campaign permanently — its activity logs stay, but no new replies will fire.`
      )
    )
      return;
    const prev = campaigns;
    setCampaigns((p) => p.filter((x) => x.id !== id));
    const res = await fetch(`/api/admin/auto-reply/campaigns/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setCampaigns(prev);
      const data = await res.json().catch(() => ({}));
      alert(`Failed to delete: ${data?.error || res.statusText}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        <AdminNav />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Auto-Reply Campaigns</h1>
            <p className="text-gray-400 mt-1">
              Match comments by keyword, fire a reply + optional DM.
            </p>
          </div>
          <Link
            href="/admin/auto-reply/new"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            <span className="text-base leading-none">+</span> New Campaign
          </Link>
        </div>

        <ConnectionStatus connections={connections} />

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-4">
            <strong>Couldn&apos;t load campaigns:</strong> {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="inline-flex bg-gray-900 border border-gray-800 rounded-xl p-1">
            {(["all", "active", "paused"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition ${
                  filter === f
                    ? "bg-green-500 text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {f}
                <span className="ml-1.5 text-[11px] opacity-70">
                  {f === "all"
                    ? campaigns.length
                    : f === "active"
                    ? campaigns.filter((c) => c.is_active).length
                    : campaigns.filter((c) => !c.is_active).length}
                </span>
              </button>
            ))}
          </div>
          <Link
            href="/admin/auto-reply/logs"
            className="text-sm font-medium text-gray-400 hover:text-white underline-offset-4 hover:underline"
          >
            View activity logs →
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
            No campaigns yet. Click &quot;New Campaign&quot; to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onToggle={() => toggleActive(c.id)}
                onDelete={() => deleteCampaign(c.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
