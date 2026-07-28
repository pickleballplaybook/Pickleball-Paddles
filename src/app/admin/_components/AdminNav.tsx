"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/shorts", label: "Shorts Generator" },
  { href: "/admin/publish", label: "Publish" },
  { href: "/admin/scheduled", label: "Scheduled" },
  { href: "/admin/auto-reply", label: "Auto Reply" },
  { href: "/admin/weekly-thumbnail", label: "Weekly Thumbnail" },
  { href: "/admin/drills", label: "Drills" },
  { href: "/admin/lessons", label: "Lessons" },
  { href: "/admin/email", label: "Acquisition" },
  { href: "/admin/challenges", label: "Challenges" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="inline-flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              active
                ? "bg-accent-500 text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
