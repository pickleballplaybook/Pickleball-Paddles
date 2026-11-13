"use client";

import { useState } from "react";

type Drill = {
  id: string;
  name: string;
  category: string;
  video_url: string;
  image?: string;
  description_beginner?: string;
  description_intermediate?: string;
  description_advanced?: string;
};

type GroupedDrills = { category: string; drills: Drill[] }[];

function vimeoEmbed(url: string): string {
  // Handles: vimeo.com/ID, vimeo.com/ID/HASH (unlisted), vimeo.com/video/ID, player.vimeo.com/video/ID
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/);
  if (!match) return url;
  const id = match[1];
  const pathHash = match[2];
  const queryHash = (url.match(/[?&]h=([a-zA-Z0-9]+)/) || [])[1];
  const h = (pathHash || queryHash) ? `&h=${pathHash || queryHash}` : "";
  return `https://player.vimeo.com/video/${id}?badge=0&autopause=0&player_id=0&app_id=58479${h}`;
}

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
type Level = (typeof LEVELS)[number];

function DrillCard({ drill }: { drill: Drill }) {
  const [level, setLevel] = useState<Level>("beginner");
  const [expanded, setExpanded] = useState(false);

  const available = LEVELS.filter((l) => drill[`description_${l}` as keyof Drill]);
  const currentDesc = drill[`description_${level}` as keyof Drill] as string | undefined;
  const displayDesc = currentDesc || available.map((l) => drill[`description_${l}` as keyof Drill]).find(Boolean);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
        <iframe
          src={vimeoEmbed(drill.video_url)}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={drill.name}
        />
      </div>

      <div className="p-4">
        <button
          className="w-full flex items-center justify-between gap-2 text-left"
          onClick={() => setExpanded((e) => !e)}
        >
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug">{drill.name}</h3>
          <svg
            className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {expanded && displayDesc && (
          <div className="mt-3">
            {available.length > 1 && (
              <div className="flex gap-1 mb-3">
                {available.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                      level === l
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400"
              dangerouslySetInnerHTML={{ __html: displayDesc }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function DrillsGrid({ grouped }: { grouped: GroupedDrills }) {
  const [activeTab, setActiveTab] = useState("All");
  const tabs = ["All", ...grouped.map((g) => g.category)];

  const visible =
    activeTab === "All"
      ? grouped
      : grouped.filter((g) => g.category === activeTab);

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-8 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Drill grid */}
      <div className="space-y-10">
        {visible.map(({ category, drills }) => (
          <section key={category}>
            {activeTab === "All" && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {category}
                <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">
                  {drills.length} drill{drills.length !== 1 ? "s" : ""}
                </span>
              </h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {drills.map((d) => (
                <DrillCard key={d.id} drill={d} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
