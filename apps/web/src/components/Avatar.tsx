/** The app's signature identity mark: initials on a name-hashed gradient, optionally wrapped
 *  in a level-progress ring (gamification made visible, wireframe's "AL / MP / SM" chips).
 *  Pure server-safe markup — no client JS. */

function hue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({
  name,
  size = 32,
  ring,
  className = "",
}: {
  name: string;
  size?: number;
  /** 0..1 progress toward the next level — renders the signature ring. */
  ring?: number;
  className?: string;
}) {
  const h = hue(name || "?");
  const chip = (
    <span
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.36)),
        background: `linear-gradient(135deg, hsl(${h} 62% 46%), hsl(${(h + 40) % 360} 60% 34%))`,
      }}
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  );
  if (ring === undefined) return chip;

  const box = size + 10;
  const r = (box - 4) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0.02, Math.min(1, ring));
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: box, height: box }}>
      <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="rgb(var(--border))" strokeWidth="2" />
        <circle
          cx={box / 2} cy={box / 2} r={r} fill="none"
          stroke="url(#lvl)" strokeWidth="2" strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
        />
        <defs>
          <linearGradient id="lvl" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--brand))" />
            <stop offset="100%" stopColor="rgb(var(--aurora2))" />
          </linearGradient>
        </defs>
      </svg>
      {chip}
    </span>
  );
}
