"use client";

import Link from "next/link";
import type { Campaign } from "./types";
import { PlatformIcon } from "./PlatformIcon";

export function CampaignCard({
  campaign,
  onToggle,
  onDelete,
}: {
  campaign: Campaign;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const lastTriggered = campaign.last_triggered_at
    ? formatRelative(campaign.last_triggered_at)
    : "Never";

  return (
    <div
      className={`group rounded-2xl border bg-gray-900 transition ${
        campaign.is_active
          ? "border-gray-800 hover:border-gray-700"
          : "border-gray-800 opacity-60"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: name + keywords */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  campaign.is_active ? "bg-accent-500" : "bg-gray-600"
                }`}
              />
              <h3 className="font-semibold text-white truncate">
                {campaign.name}
              </h3>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {campaign.keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center rounded border border-gray-700 bg-gray-950 px-2 py-0.5 text-xs font-mono text-gray-300"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Right: platforms + toggle */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              {(["instagram", "facebook", "youtube"] as const).map((p) => {
                const enabled = campaign.platforms.includes(p);
                return (
                  <div
                    key={p}
                    className={`h-7 w-7 rounded flex items-center justify-center ${
                      enabled
                        ? "bg-accent-500 text-black"
                        : "bg-gray-800 text-gray-600"
                    }`}
                    title={`${p} ${enabled ? "enabled" : "disabled"}`}
                  >
                    <PlatformIcon platform={p} className="h-3.5 w-3.5" />
                  </div>
                );
              })}
            </div>

            <button
              onClick={onToggle}
              role="switch"
              aria-checked={campaign.is_active}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                campaign.is_active ? "bg-accent-500" : "bg-gray-700"
              }`}
              title={campaign.is_active ? "Pause campaign" : "Activate campaign"}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  campaign.is_active ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-5">
            <span>
              <span className="font-mono font-semibold text-white">
                {campaign.triggers_count?.toLocaleString() ?? 0}
              </span>{" "}
              triggers
            </span>
            <span>
              Last fired{" "}
              <span className="text-gray-300 font-medium">{lastTriggered}</span>
            </span>
            <span>
              Target:{" "}
              <span className="text-gray-300 font-medium">
                {campaign.target_mode === "all"
                  ? "All posts"
                  : `${campaign.target_post_ids.length} post${
                      campaign.target_post_ids.length === 1 ? "" : "s"
                    }`}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/auto-reply/edit/${campaign.id}`}
              className="font-medium text-gray-300 hover:text-white"
            >
              Edit
            </Link>
            <Link
              href={`/admin/auto-reply/logs?campaign=${campaign.id}`}
              className="font-medium text-gray-300 hover:text-white"
            >
              Logs
            </Link>
            <button
              onClick={onDelete}
              className="font-medium text-red-400 hover:text-red-300"
              title="Delete this campaign"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
