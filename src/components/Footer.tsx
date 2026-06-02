import Link from "next/link";
import { Youtube } from "lucide-react";
import { siteConfig } from "@/config/site";
import SubstackEmbed from "@/components/SubstackEmbed";

const NAV_LINKS = [
  { label: "Paddles",         href: "/paddles"          },
  { label: "Reviews",         href: "/reviews"          },
  { label: "Compare",         href: "/compare"          },
  { label: "Gear",            href: "/gear"             },
  { label: "What's Trending", href: "/#trending"        },
  { label: "What's New",      href: "/#whats-new"       },
  { label: "Join Newsletter", href: siteConfig.substackUrl, external: true },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)" }}>
      {/* ── Newsletter capture (Substack official 1-click embed) ──────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-md">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
            Free Newsletter
          </p>
          <p className="text-lg font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
            Get this week&apos;s paddle picks + discount codes
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Weekly · One-click signup · Unsubscribe anytime · No spam, ever.
          </p>
        </div>
        <div className="md:flex-shrink-0">
          <SubstackEmbed height={150} />
        </div>
      </div>
      <div style={{ height: 1, background: "var(--border)", margin: "8px auto 0", maxWidth: "calc(100% - 2rem)" }} />

      {/* ── Main row ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row sm:items-start justify-between gap-8">

        {/* Left — brand + nav */}
        <div>
          <p className="text-sm font-bold tracking-wide mb-4" style={{ color: "var(--text-primary)" }}>
            {siteConfig.name}
          </p>
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map(({ label, href, external }) =>
              external ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors hover:text-brand-500"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  href={href}
                  className="text-sm transition-colors hover:text-brand-500"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </Link>
              )
            )}
          </nav>
        </div>

        {/* Right — YouTube */}
        <div className="flex items-start">
          <a
            href={siteConfig.youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-brand-500"
            style={{ color: "var(--text-muted)" }}
          >
            <Youtube className="w-4 h-4 text-red-500" />
            @playbookreviews
          </a>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          © 2026 Pickleball Playbook. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
