"use client";

import { useState, useRef, useEffect } from "react";

const TABS = [
  { id: "specs",       label: "Performance & Specs" },
  { id: "who",         label: "Who It's For" },
  { id: "feel",        label: "Feel" },
  { id: "video",       label: "YouTube Review" },
  { id: "discussion",  label: "Discussion" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function PaddleDetailTabs() {
  const [active, setActive] = useState<TabId>("specs");
  const barRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Scroll active tab into view within the tab bar (horizontal only, never scroll the page)
  useEffect(() => {
    const btn = tabRefs.current[active];
    const bar = barRef.current;
    if (btn && bar) {
      const left = btn.offsetLeft - bar.offsetWidth / 2 + btn.offsetWidth / 2;
      bar.scrollTo({ left, behavior: "smooth" });
    }
  }, [active]);

  // Intersection observer: highlight tab when its section scrolls into view
  useEffect(() => {
    const ids = TABS.map((t) => t.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id as TabId);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: TabId) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 160;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div
      ref={barRef}
      className="sticky top-[68px] z-30 border-b overflow-x-auto scrollbar-hide"
      style={{
        background: "var(--flip-bg)",
        borderColor: "var(--flip-card-border)",
      }}
    >
      <div className="container-xl flex gap-0 min-w-max">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[tab.id] = el; }}
            onClick={() => scrollTo(tab.id)}
            className="relative px-5 py-4 text-sm font-semibold whitespace-nowrap transition-colors"
            style={{
              color: active === tab.id ? "#14b8a6" : "var(--flip-text-muted)",
            }}
          >
            {tab.label}
            {active === tab.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: "#14b8a6" }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
