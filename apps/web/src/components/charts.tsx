"use client";

import { useId } from "react";
import { Area, AreaChart, Cell, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";

// recharts needs real color values (SVG fill/stroke), not Tailwind classes — these are the
// exact same fixed literals tailwind.config.ts uses for green/amber/red (not new colors), and
// "rgb(var(--brand))"/"rgb(var(--accent-teal))" resolve live against whichever skin is active
// (accent-teal is fixed across skins, same as brand-gold), same as everywhere else.
const GREEN = "rgb(16 185 129)";
const AMBER = "rgb(245 158 11)";
const RED = "rgb(239 68 68)";
const BRAND = "rgb(var(--brand))";
const ACCENT_TEAL = "rgb(var(--accent-teal))";
const BORDER = "rgb(var(--border))";
const MUTED = "rgb(var(--muted))";

/** Green/amber/red donut with a center label — the compliance risk breakdown, replacing a bare
 *  Meter bar. Each segment gets a subtle gradient (same hue, lighter-to-true) for more visual
 *  weight than a flat fill. Falls back to a flat gray ring when there's nothing to show yet. */
export function RiskDonut({
  green, amber, red, centerValue, centerLabel,
}: { green: number; amber: number; red: number; centerValue: string; centerLabel: string }) {
  const gid = useId();
  const total = green + amber + red;
  const data = total === 0
    ? [{ name: "No data", value: 1, color: BORDER, gradient: null }]
    : [
        { name: "Compliant", value: green, color: GREEN, gradient: `url(#${gid}-green)` },
        { name: "Due", value: amber, color: AMBER, gradient: `url(#${gid}-amber)` },
        { name: "At risk", value: red, color: RED, gradient: `url(#${gid}-red)` },
      ].filter((d) => d.value > 0);

  return (
    <div className="relative h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id={`${gid}-green`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity={0.75} /><stop offset="100%" stopColor={GREEN} />
            </linearGradient>
            <linearGradient id={`${gid}-amber`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={AMBER} stopOpacity={0.75} /><stop offset="100%" stopColor={AMBER} />
            </linearGradient>
            <linearGradient id={`${gid}-red`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity={0.75} /><stop offset="100%" stopColor={RED} />
            </linearGradient>
          </defs>
          <Pie
            data={data} dataKey="value" nameKey="name" innerRadius="65%" outerRadius="100%"
            paddingAngle={total ? 3 : 0} stroke="none" isAnimationActive animationDuration={500}
          >
            {data.map((d) => <Cell key={d.name} fill={d.gradient ?? d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-2xl font-semibold">{centerValue}</p>
        <p className="text-center text-[10px] leading-tight text-muted">{centerLabel}</p>
      </div>
    </div>
  );
}

export interface SkillRadarPoint {
  skill: string;
  current: number;
  target: number;
}

/** Current-vs-target skill levels on one radar — the "at a glance" view that pairs with the
 *  detailed gap table below it. The "current" series uses a brand→teal gradient fill for more
 *  visual weight than a flat tint. Only meaningful with at least 3 skills (axes); callers should
 *  fall back to the table alone below that. */
export function SkillRadar({ data, max = 5 }: { data: SkillRadarPoint[]; max?: number }) {
  const gid = useId();
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <defs>
            <linearGradient id={`${gid}-current`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={BRAND} /><stop offset="100%" stopColor={ACCENT_TEAL} />
            </linearGradient>
          </defs>
          <PolarGrid stroke={BORDER} />
          <PolarAngleAxis dataKey="skill" tick={{ fill: MUTED, fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, max]} tick={false} axisLine={false} />
          <Radar name="Target" dataKey="target" stroke={BORDER} fill={BORDER} fillOpacity={0.35} isAnimationActive animationDuration={500} />
          <Radar
            name="Current" dataKey="current" stroke={BRAND} fill={`url(#${gid}-current)`} fillOpacity={0.55}
            isAnimationActive animationDuration={500}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** A small inline trend area for MetricCard — deliberately just the two points we actually know
 *  (previous = current - delta, current), not a fabricated multi-point history. The filled area
 *  (vs. a bare line) gives it more visual weight to match the rest of the "intelligence" styling. */
export function Sparkline({ points, down = false }: { points: number[]; down?: boolean }) {
  const gid = useId();
  const data = points.map((v, i) => ({ i, v }));
  const color = down ? RED : GREEN;
  return (
    <div className="h-8 w-16 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          <defs>
            <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gid}-fill)`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
