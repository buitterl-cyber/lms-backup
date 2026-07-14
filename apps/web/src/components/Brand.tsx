/* eslint-disable @next/next/no-img-element */

/** The Riyada Intelligence brand lockup: Carl's diamond mark + the wordmark. The mark is a
 *  transparent PNG cut from the official logo, so it sits on any skin. */
export function Brand({ size = 26, className = "", text = true }: { size?: number; className?: string; text?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src="/brand/riyada-mark.png" alt="Riyada Intelligence" width={size} height={Math.round(size * 1.006)} />
      {text && (
        <span className="font-display font-semibold leading-none">
          Riyada<span className="text-brand">Intel</span>
        </span>
      )}
    </span>
  );
}
