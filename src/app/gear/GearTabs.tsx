"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { GearProduct, GearCategory } from "@/data/products";

const TABS: { label: string; value: GearCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Training", value: "training" },
  { label: "Shoes", value: "shoes" },
  { label: "Bags", value: "bags" },
  { label: "Balls", value: "balls" },
  { label: "Accessories", value: "accessories" },
];

function GridCard({ p }: { p: GearProduct }) {
  return (
    <Link href={`/gear/${p.id}`} className="block group">
      <div
        className="rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-200 group-hover:scale-[1.01]"
        style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        }}
      >
        <div
          className="w-full flex items-center justify-center p-6"
          style={{ aspectRatio: "4/3" }}
        >
          {p.imageAspect !== "none" && p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.image}
              alt={`${p.brand} ${p.name}`}
              className="w-full h-full object-contain"
              style={{ maxHeight: "170px" }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(90,157,249,0.15)" }}
            >
              <span className="text-2xl">🎾</span>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          {p.brand && (
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              {p.brand}
            </p>
          )}
          <h3
            className="text-sm font-extrabold leading-snug mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            {p.name}
          </h3>

          <div className="mt-auto flex items-center justify-between gap-2">
            <span
              className="text-base font-bold"
              style={{ color: p.price === "Free" ? "#5a9df9" : "var(--text-primary)" }}
            >
              {p.price || ""}
            </span>
            {p.badge && (
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{
                  background: "rgba(34,197,94,0.14)",
                  color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.28)",
                }}
              >
                {p.badge}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GearTabs({ products }: { products: GearProduct[] }) {
  const [active, setActive] = useState<GearCategory | "all">("all");

  const filtered =
    active === "all" ? products : products.filter((p) => p.category === active);

  const counts = Object.fromEntries(
    TABS.map((t) => [
      t.value,
      t.value === "all"
        ? products.length
        : products.filter((p) => p.category === t.value).length,
    ])
  );

  return (
    <>
      {/* Tab bar */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 mb-8"
        style={{ scrollbarWidth: "none" }}
      >
        {TABS.filter((t) => counts[t.value] > 0).map((t) => {
          const isActive = active === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setActive(t.value)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, #3a8bf0, #2066d0)",
                      color: "#fff",
                      boxShadow: "0 0 18px rgba(90,157,249,0.35)",
                    }
                  : {
                      background: "var(--bg-card)",
                      color: "var(--text-muted)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }
              }
            >
              {t.label}
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={
                  isActive
                    ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                    : { background: "rgba(255,255,255,0.07)", color: "var(--text-muted)" }
                }
              >
                {counts[t.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <GridCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p style={{ color: "var(--text-muted)" }}>No products in this category yet.</p>
        </div>
      )}
    </>
  );
}
