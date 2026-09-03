/* eslint-disable @next/next/no-img-element */

/** The Riyada Intelligence brand lockup: official mark + wordmark, matching
 *  /public/brand/riyada-logo.png — navy "Riyada" (bold) + slate "Intelligence" (regular), the
 *  same two-weight treatment as the real logo. The orange from the icon's sweep is deliberately
 *  not repeated in the text — the real logo keeps orange confined to the mark. */
export function Brand({
  size = 26,
  className = "",
  text = true,
  inverted = false,
}: {
  size?: number;
  className?: string;
  text?: boolean;
  /** White/muted-white wordmark for dark surfaces. */
  inverted?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/brand/riyada-mark.png"
        alt="Riyada Intelligence logo"
        width={size}
        height={Math.round(size * 1.006)}
        aria-hidden
      />
      {text && (
        <span className="font-display leading-none tracking-tight" aria-label="Riyada Intelligence">
          <span className={`font-semibold ${inverted ? "text-white" : "text-brand"}`}>Riyada</span>
          <span className={`ms-1 font-normal ${inverted ? "text-white/70" : "text-muted"}`}>Intelligence</span>
        </span>
      )}
    </span>
  );
}
