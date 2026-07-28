"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/shorts", label: "Shorts Generator", match: "/admin/shorts" },
  { href: "/admin/publish", label: "Publish", match: "/admin/publish" },
  { href: "/admin/scheduled", label: "Scheduled", match: "/admin/scheduled" },
  { href: "/admin/auto-reply", label: "Auto Reply", match: "/admin/auto-reply" },
  { href: "/admin/weekly-thumbnail", label: "Weekly Thumbnail", match: "/admin/weekly-thumbnail" },
  { href: "/admin/drills", label: "Drills", match: "/admin/drills" },
  { href: "/admin/lessons", label: "Lessons", match: "/admin/lessons" },
  { href: "/admin/email?view=acquisition", label: "Acquisition", match: "/admin/email" },
  { href: "/admin/challenges", label: "Challenges", match: "/admin/challenges" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="inline-flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.match);
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
