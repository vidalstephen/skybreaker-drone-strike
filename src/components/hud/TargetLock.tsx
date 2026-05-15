/**
 * TargetLock HUD — Stage 5a
 *
 * Compact panel showing the currently selected target's label, type badge,
 * distance, health bar, and lock-ring arc. Positioned top-left of the bottom
 * HUD region so it does not obscure the radar, compass, or vitals.
 *
 * Props driven by GameState.targetLock. Hides when targetLock is null.
 */

import type { TargetLockSnapshot } from '../../types/game';
import { TrackedEntityType } from '../../types/game';

export interface TargetLockProps {
  lock: TargetLockSnapshot | null;
  reduceEffects?: boolean;
}

// Radius and circumference of the SVG lock ring
const RING_R          = 22;
const RING_CIRCUMF    = 2 * Math.PI * RING_R;

function typeColor(type: TrackedEntityType): string {
  switch (type) {
    case TrackedEntityType.OBJECTIVE:  return '#f27d26';
    case TrackedEntityType.WEAK_POINT: return '#f59e0b';
    case TrackedEntityType.ENEMY:      return '#ef4444';
    default:                           return '#94a3b8';
  }
}

function typeBadge(type: TrackedEntityType, domain?: 'air' | 'ground' | 'sea'): string {
  switch (type) {
    case TrackedEntityType.OBJECTIVE:  return 'OBJ';
    case TrackedEntityType.WEAK_POINT: return 'WPT';
    case TrackedEntityType.ENEMY:
      // Stage 5f: domain-specific enemy badge
      if (domain === 'ground') return 'GND';
      if (domain === 'sea')    return 'SEA';
      return 'AIR';
    default:                           return '---';
  }
}

export function TargetLock({ lock, reduceEffects }: TargetLockProps) {
  if (!lock) return null;

  const { label, type, distance, health, maxHealth, lockState, lockProgress, isManual, domain, routeHint } = lock;
  const color   = typeColor(type);
  const badge   = typeBadge(type, domain);
  const locked  = lockState === 'locked';
  const hpPct   = health !== undefined && maxHealth ? Math.max(0, health / maxHealth) : null;

  // Lock ring arc: stroke-dashoffset drives how much of the ring is filled
  const arcFilled = RING_CIRCUMF * lockProgress;
  const arcEmpty  = RING_CIRCUMF - arcFilled;

  return (
    <div
      className="flex items-center gap-2 pointer-events-none select-none"
      aria-label={`Selected target: ${label}`}
    >
      {/* Lock ring SVG */}
      <svg
        width={56}
        height={56}
        viewBox="-28 -28 56 56"
        className="flex-shrink-0"
        style={{ overflow: 'visible' }}
      >
        {/* Background ring */}
        <circle
          r={RING_R}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.15}
        />
        {/* Progress arc — starts at top (-90°) */}
        <circle
          r={RING_R}
          fill="none"
          stroke={color}
          strokeWidth={locked ? 2.5 : 2}
          strokeDasharray={`${arcFilled} ${arcEmpty}`}
          strokeDashoffset={RING_CIRCUMF * 0.25}
          strokeLinecap="round"
          opacity={lockProgress > 0 ? 0.9 : 0}
          style={{ transition: reduceEffects ? 'none' : 'stroke-dasharray 80ms linear' }}
        />
        {/* Corner brackets — four 90° arcs at cardinal positions */}
        {[0, 90, 180, 270].map(deg => (
          <g key={deg} transform={`rotate(${deg})`}>
            <path
              d={`M 0 -${RING_R - 6} L 0 -${RING_R + 3}`}
              stroke={color}
              strokeWidth={1.5}
              opacity={0.5}
            />
          </g>
        ))}
        {/* Locked flash */}
        {locked && !reduceEffects && (
          <circle r={RING_R - 8} fill={color} opacity={0.1}>
            <animate attributeName="opacity" values="0.1;0.25;0.1" dur="1.2s" repeatCount="indefinite" />
          </circle>
        )}
        {/* Center dot */}
        <circle
          r={2.5}
          fill={color}
          opacity={locked ? 1 : 0.5}
        />
      </svg>

      {/* Target info panel */}
      <div className="flex flex-col gap-0.5 min-w-0">
        {/* Badge + lock indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-[7px] font-bold tracking-widest px-1 py-0.5 border"
            style={{ color, borderColor: color, opacity: 0.9 }}
          >
            {badge}
          </span>
          {isManual && (
            <span className="text-[6px] font-bold tracking-widest opacity-60" style={{ color }}>
              MAN
            </span>
          )}
          {locked && (
            <span
              className="text-[7px] font-black tracking-[0.3em]"
              style={{ color }}
            >
              LOCK
            </span>
          )}
          {!locked && lockProgress > 0 && (
            <span className="text-[6px] font-bold tracking-widest opacity-60" style={{ color }}>
              ACQ
            </span>
          )}
        </div>

        {/* Label */}
        <div
          className="text-[9px] font-bold uppercase tracking-[0.15em] truncate max-w-[120px]"
          style={{ color }}
        >
          {label}
        </div>

        {/* Distance */}
        <div className="text-[7px] font-mono tracking-widest text-white/40">
          {Math.round(distance)} M
        </div>

        {/* Health bar — only when health data available */}
        {hpPct !== null && (
          <div className="w-20 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${Math.round(hpPct * 100)}%`,
                backgroundColor: hpPct > 0.5 ? color : hpPct > 0.25 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
        )}

        {/* Stage 5f: routing hint — authored route guidance for moving targets */}
        {routeHint && (
          <div
            className="mt-0.5 text-[6px] font-mono uppercase tracking-[0.1em] leading-snug max-w-[130px]"
            style={{ color: `${color}99` }}
          >
            {routeHint}
          </div>
        )}
      </div>
    </div>
  );
}
