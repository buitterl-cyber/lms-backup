/* eslint-disable @next/next/no-img-element */

/** The Riyada Intelligence brand lockup: official mark + wordmark.
 *  “Riyada” + “Intel” are separated by weight/colour so the name reads clearly on light or dark. */
export function Brand({
  size = 26,
  className = "",
  text = true,
  inverted = false,
}: {
  size?: number;
  className?: string;
  text?: boolean;
  /** White wordmark for dark surfaces; Intel stays teal. */
  inverted?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/brand/riyada-mark.png"
        alt=""
        width={size}
        height={Math.round(size * 1.006)}
        aria-hidden
      />
      {text && (
        <span className="font-display leading-none tracking-tight" aria-label="RiyadaIntel">
          <span className={`font-semibold ${inverted ? "text-white" : "text-fg"}`}>Riyada</span>
          <span className={`font-semibold ${inverted ? "text-accentTeal" : "text-brand"}`}>Intel</span>
        </span>
      )}
    </span>
  );
}
