"use client";

import { useEffect, useRef, useState } from "react";

const CHARTREUSE = "#defa32";

// The composite demo is three segments inside a single portrait MP4:
//   Segment A: 0..LANDSCAPE_START_SEC  — portrait app intro (Home → Drills)
//   Segment B: LANDSCAPE_START_SEC..LANDSCAPE_END_SEC — drill content stored
//              sideways in portrait pixels (ffmpeg -noautorotate on input).
//              The phone-frame rotates 90° CCW so the raw pixels read upright
//              and the phone visually turns like the user is flipping it.
//   Segment C: LANDSCAPE_END_SEC..end — portrait technique navigation.
// Scale-down during rotation keeps the rotated width inside mobile viewports.
const LANDSCAPE_START_SEC = 17.0;
const LANDSCAPE_END_SEC = 29.0;

export default function AppPreview({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const t = v.currentTime;
      setIsLandscape(t >= LANDSCAPE_START_SEC && t < LANDSCAPE_END_SEC);
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("seeked", onTime);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("seeked", onTime);
    };
  }, []);

  return (
    <section
      id="app-preview"
      className="py-16 md:py-20 overflow-hidden"
      style={{ background: "rgba(0,0,0,0.30)" }}
    >
      <div className="container-xl">
        <div className="text-center mb-10">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3"
            style={{ color: CHARTREUSE }}
          >
            See It In Action
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            From a drill to a <span style={{ color: CHARTREUSE }}>full technique breakdown</span> in two taps.
          </h2>
        </div>

        <div
          className="flex items-center justify-center"
          style={{ minHeight: "min(760px, 175vw)" }}
        >
          <div
            className="rounded-[2.25rem] relative"
            style={{
              width: "min(330px, 75vw)",
              background: "#000",
              border: "9px solid #1a2638",
              boxShadow:
                "0 40px 100px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
              transform: isLandscape
                ? "rotate(-90deg) scale(1.05)"
                : "rotate(0deg) scale(1)",
              transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
              transformOrigin: "center center",
              willChange: "transform",
              overflow: "hidden",
            }}
          >
            {/* Fake iOS status bar — masks the source recording's real-iOS
                battery indicator (which dipped to 3% mid-recording). Only
                renders during portrait segments; fades out when the phone
                rotates so it doesn't clash with the landscape video. */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "5.5%",
                background: "#000",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 18px",
                color: "#fff",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.02em",
                opacity: isLandscape ? 0 : 1,
                transition: "opacity 0.35s ease-in-out",
                pointerEvents: "none",
              }}
            >
              <span>9:41</span>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                {/* Signal — three ascending bars */}
                <svg width="14" height="10" viewBox="0 0 14 10" fill="#fff" aria-hidden>
                  <rect x="0" y="6" width="2.5" height="4" rx="0.5" />
                  <rect x="4" y="4" width="2.5" height="6" rx="0.5" />
                  <rect x="8" y="2" width="2.5" height="8" rx="0.5" />
                  <rect x="12" y="0" width="2.5" height="10" rx="0.5" />
                </svg>
                {/* Wifi — concentric arcs */}
                <svg width="14" height="10" viewBox="0 0 14 10" fill="#fff" aria-hidden>
                  <path d="M7 9.2a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2zM3.4 5.5l-1.4-1.4a7 7 0 0 1 10 0L10.6 5.5a5 5 0 0 0-7.2 0zM5.4 7.5L4 6.1a4 4 0 0 1 6 0L8.6 7.5a2 2 0 0 0-3.2 0z" />
                </svg>
                {/* Battery — 100% (full green fill) */}
                <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600 }}>100%</span>
                  <svg width="22" height="11" viewBox="0 0 22 11" aria-hidden>
                    <rect x="0.5" y="0.5" width="19" height="10" rx="2.5" fill="none" stroke="#fff" strokeOpacity="0.5" />
                    <rect x="2" y="2" width="16" height="7" rx="1" fill="#fff" />
                    <rect x="20" y="3.5" width="1.5" height="4" rx="0.5" fill="#fff" fillOpacity="0.5" />
                  </svg>
                </div>
              </div>
            </div>

            <video
              ref={videoRef}
              src={src}
              playsInline
              autoPlay
              muted
              loop
              controls
              className="w-full h-auto block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
