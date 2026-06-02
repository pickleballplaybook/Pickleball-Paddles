/**
 * Official Substack iframe embed — true 1-click signup, no server-to-server
 * POSTs (which Substack blocks with 403). Users enter their email inside the
 * iframe and Substack adds them to the list directly.
 *
 * Trade-off: the iframe is Substack-styled (limited visual customization),
 * so we wrap it in a dark container that matches the site for the rest of
 * the surrounding UI.
 */
interface Props {
  /** Optional override of the published embed URL. */
  src?: string;
  /** Fixed pixel height of the iframe — Substack embeds don't auto-size. */
  height?: number;
  /** Width — defaults to 100% of the container. */
  width?: string | number;
  /** Tailwind / inline rounding on the wrapper. */
  className?: string;
}

const DEFAULT_SRC = "https://pickleballplaybook.substack.com/embed";

export default function SubstackEmbed({
  src = DEFAULT_SRC,
  height = 320,
  width = "100%",
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        // The Substack iframe defaults to a white background; this dark
        // wrapper hides the seam at the corners and adds our site styling.
        background: "var(--bg-card)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 12px 36px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
        maxWidth: 540,
      }}
    >
      <iframe
        src={src}
        width={width as number | string}
        height={height}
        style={{ border: 0, display: "block", background: "white" }}
        loading="lazy"
        title="Subscribe to the Pickleball Playbook newsletter"
      />
    </div>
  );
}
