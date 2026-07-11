/**
 * Empty ad slot. Renders a labeled placeholder `<div>` with an ID
 * that Ezoic / Mediavine / Raptive scripts can target. Once you sign
 * up for a network and paste their loader script in _app or the root
 * layout, these divs will auto-fill with real ads. No changes to this
 * component are needed at that point.
 *
 * `id` should be unique per page (e.g. "top", "mid-3", "bottom"). We
 * prefix with `pb-ad-` so it doesn't collide with any host-page markup.
 *
 * Design mirrors The Dink's ad slots — full width, centered, with a
 * min-height so the layout doesn't jump when ads load. Muted "ad"
 * label so it's clear this space is monetized (required by most
 * networks + AdSense policy).
 */
export function AdSlot({ id, minHeight = 250 }: { id: string; minHeight?: number }) {
  return (
    <div
      className="my-8 flex flex-col items-center"
      style={{ minHeight }}
      aria-label="Advertisement"
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-widest mb-1"
        style={{ color: "var(--text-muted)" }}
      >
        Advertisement
      </span>
      <div
        id={`pb-ad-${id}`}
        className="w-full max-w-3xl"
        style={{ minHeight, background: "transparent" }}
      />
    </div>
  );
}
