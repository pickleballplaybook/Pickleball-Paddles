"use client";

import Link from "next/link";
import type { SocialConnection } from "./types";
import { PlatformIcon } from "./PlatformIcon";

export function ConnectionStatus({
  connections,
}: {
  connections: SocialConnection[];
}) {
  const platforms: Array<SocialConnection["platform"]> = [
    "instagram",
    "facebook",
    "youtube",
  ];

  return (
    <div className="rounded-lg border border-stone-200 bg-white">
      <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
          Connected Accounts
        </h2>
        <Link
          href="/admin/auto-reply/connections"
          className="text-xs font-medium text-stone-500 hover:text-stone-900"
        >
          Manage →
        </Link>
      </div>
      <div className="grid grid-cols-3 divide-x divide-stone-100">
        {platforms.map((platform) => {
          const conn = connections.find((c) => c.platform === platform);
          const connected = conn?.is_active;

          return (
            <div key={platform} className="px-5 py-4 flex items-center gap-3">
              <div
                className={`shrink-0 h-9 w-9 rounded-md flex items-center justify-center ${
                  connected ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400"
                }`}
              >
                <PlatformIcon platform={platform} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium capitalize truncate">
                  {platform === "youtube" ? "YouTube" : platform}
                </p>
                <p className="text-xs text-stone-500 truncate">
                  {connected ? conn.account_name : "Not connected"}
                </p>
              </div>
              <div
                className={`shrink-0 h-1.5 w-1.5 rounded-full ${
                  connected ? "bg-emerald-500" : "bg-stone-300"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
