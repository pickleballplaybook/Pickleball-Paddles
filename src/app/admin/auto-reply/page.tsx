"use client";

import { useState } from "react";
import Link from "next/link";
import { CampaignCard } from "./_components/CampaignCard";
import { ConnectionStatus } from "./_components/ConnectionStatus";
import { MOCK_CAMPAIGNS, MOCK_CONNECTIONS } from "./_components/mockData";
import type { Campaign } from "./_components/types";

export default function AutoReplyAdminPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  const filtered = campaigns.filter((c) => {
    if (filter === "active") return c.is_active;
    if (filter === "paused") return !c.is_active;
    return true;
  });

  const toggleActive = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
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
        {/* Connection status row */}
        <ConnectionStatus connections={MOCK_CONNECTIONS} />

        {/* Filter tabs */}
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

        {/* Campaign list */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-stone-200 bg-white p-12 text-center">
            <p className="text-stone-500 text-sm">
              No campaigns yet. Create your first one to start auto-replying.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onToggle={() => toggleActive(campaign.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
