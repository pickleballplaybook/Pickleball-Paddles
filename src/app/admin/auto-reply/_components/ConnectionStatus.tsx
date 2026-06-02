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
    <div className="rounded-2xl border border-gray-800 bg-gray-900">
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Connected Accounts
        </h2>
        <Link
          href="/admin/auto-reply/connections"
          className="text-xs font-medium text-gray-400 hover:text-white"
        >
          Manage →
        </Link>
      </div>
      <div className="grid grid-cols-3 divide-x divide-gray-800">
        {platforms.map((platform) => {
          const conn = connections.find((c) => c.platform === platform);
          const connected = conn?.is_active;

          return (
            <div key={platform} className="px-5 py-4 flex items-center gap-3">
              <div
                className={`shrink-0 h-9 w-9 rounded-md flex items-center justify-center ${
                  connected
                    ? "bg-accent-500 text-black"
                    : "bg-gray-800 text-gray-600"
                }`}
              >
                <PlatformIcon platform={platform} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium capitalize truncate">
                  {platform === "youtube" ? "YouTube" : platform}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {connected ? conn.account_name : "Not connected"}
                </p>
              </div>
              <div
                className={`shrink-0 h-1.5 w-1.5 rounded-full ${
                  connected ? "bg-accent-500" : "bg-gray-700"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
