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

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500 font-medium">
              Pickleball Playbook
            </p>
            <h1 className="text-2xl font-semibold tracking-tight mt-0.5">
              Auto-Reply Campaigns
            </h1>
          </div>
          <Link
            href="/admin/auto-reply/new"
            className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition"
          >
            <span className="text-base leading-none">+</span> New Campaign
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <AdminNav />
        <ConnectionStatus connections={connections} />

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <strong>Couldn't load campaigns:</strong> {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-md border border-stone-200 bg-white p-0.5">
            {(["all", "active", "paused"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-medium rounded capitalize transition ${
                  filter === f
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {f}
                <span className="ml-1.5 text-[11px] opacity-60">
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
            className="text-sm font-medium text-stone-600 hover:text-stone-900 underline-offset-4 hover:underline"
          >
            View activity logs →
          </Link>
        </div>

        {loading ? (
          <div className="text-stone-500 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-12 text-center text-stone-500">
            No campaigns yet. Click "New Campaign" to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onToggle={() => toggleActive(c.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
