import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse pickleball gear by category — paddles, ball machines, bags, shoes, and accessories.",
};

const categories = [
  {
    label: "Paddles",
    description: "Browse all pickleball paddles sorted by performance.",
    href: "/paddles",
    available: true,
    count: "8 listed",
  },
  {
    label: "Ball Machines",
    description: "Automated ball machines for solo drilling and practice.",
    href: "#",
    available: false,
    count: "Coming soon",
  },
  {
    label: "Bags",
    description: "Paddle bags, backpacks, and court bags from top brands.",
    href: "#",
    available: false,
    count: "Coming soon",
  },
  {
    label: "Shoes",
    description: "Court shoes built for lateral movement and comfort.",
    href: "#",
    available: false,
    count: "Coming soon",
  },
  {
    label: "Accessories",
    description: "Grips, balls, eyewear, and everything else you need.",
    href: "#",
    available: false,
    count: "Coming soon",
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen pt-32" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-20">
        <div className="mb-14">
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">
            Shop By Category
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-3">
            Categories
          </h1>
          <p className="text-slate-400 text-lg">
            Everything a pickleball player needs — all with code{" "}
            <span className="font-mono font-semibold text-brand-600">
              PLAYBOOK
            </span>{" "}
            at checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map(({ label, description, href, available, count }) => (
            <div
              key={label}
              className={`card p-6 flex flex-col ${
                available ? "group" : "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-900">{label}</h2>
                {available ? (
                  <span className="badge badge-green">{count}</span>
                ) : (
                  <span className="badge bg-slate-100 text-slate-400 border border-slate-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {count}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed flex-1 mb-5">
                {description}
              </p>
              {available ? (
                <Link
                  href={href}
                  className="btn-secondary text-sm py-2.5 justify-between group/btn"
                >
                  <span>Browse {label}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 text-sm text-slate-400 font-medium px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <Clock className="w-4 h-4" />
                  Coming Soon
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
