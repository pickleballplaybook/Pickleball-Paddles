// Decorative lab calibration grid — purely presentational, aria-hidden.
// Renders a fine grid with major gridlines and corner calibration marks.
export default function LabGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden>
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          {/* Fine grid: every 40px */}
          <pattern id="lab-grid-fine" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" style={{ stroke: "rgba(var(--lab-green-rgb),0.035)" }} strokeWidth="0.5" />
          </pattern>
          {/* Major grid: every 200px */}
          <pattern id="lab-grid-major" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M 200 0 L 0 0 0 200" fill="none" style={{ stroke: "rgba(var(--lab-green-rgb),0.07)" }} strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lab-grid-fine)" />
        <rect width="100%" height="100%" fill="url(#lab-grid-major)" />
      </svg>

      {/* Corner calibration marks — 20px L-shaped brackets */}
      {/* Top-left */}
      <svg style={{ position: "absolute", top: 20, left: 20 }} width="20" height="20" viewBox="0 0 20 20">
        <path d="M0 20 L0 0 L20 0" fill="none" style={{ stroke: "rgba(var(--lab-green-rgb),0.35)" }} strokeWidth="1" />
      </svg>
      {/* Top-right */}
      <svg style={{ position: "absolute", top: 20, right: 20 }} width="20" height="20" viewBox="0 0 20 20">
        <path d="M20 20 L20 0 L0 0" fill="none" style={{ stroke: "rgba(var(--lab-green-rgb),0.35)" }} strokeWidth="1" />
      </svg>
      {/* Bottom-left */}
      <svg style={{ position: "absolute", bottom: 20, left: 20 }} width="20" height="20" viewBox="0 0 20 20">
        <path d="M0 0 L0 20 L20 20" fill="none" style={{ stroke: "rgba(var(--lab-green-rgb),0.35)" }} strokeWidth="1" />
      </svg>
      {/* Bottom-right */}
      <svg style={{ position: "absolute", bottom: 20, right: 20 }} width="20" height="20" viewBox="0 0 20 20">
        <path d="M20 0 L20 20 L0 20" fill="none" style={{ stroke: "rgba(var(--lab-green-rgb),0.35)" }} strokeWidth="1" />
      </svg>

      {/* Horizontal tick strip — top edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, transparent, rgba(var(--lab-green-rgb),0.08) 20%, rgba(var(--lab-green-rgb),0.08) 80%, transparent)",
        }}
      />
      {/* Vertical tick strip — left edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 4,
          background: "linear-gradient(180deg, transparent, rgba(var(--lab-green-rgb),0.06) 20%, rgba(var(--lab-green-rgb),0.06) 80%, transparent)",
        }}
      />

      {/* Radial glow — upper right, behind the 3D canvas */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "60vw",
          height: "60vw",
          maxWidth: 700,
          maxHeight: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(var(--lab-green-rgb),0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
