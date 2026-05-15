/**
 * SurfaceWarning HUD — Stage 5d
 *
 * Flashing indicator that appears when a ground threat emplacement (SAM battery,
 * flak cannon, railgun) has the player within firing range. Positioned top-center
 * to be distinct from the TargetLock panel (top-left) and not overlap radar or compass.
 *
 * Driven by GameState.surfaceWarning. Hidden when false.
 */

import { useEffect, useRef, useState } from 'react';

export interface SurfaceWarningProps {
  active?: boolean;
  reduceEffects?: boolean;
}

export function SurfaceWarning({ active, reduceEffects }: SurfaceWarningProps) {
  const [blink, setBlink] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active || reduceEffects) {
      setBlink(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => setBlink(v => !v), 400);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, reduceEffects]);

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        pointerEvents: 'none',
        opacity: reduceEffects ? 1 : blink ? 1 : 0.25,
        transition: reduceEffects ? undefined : 'opacity 0.12s ease',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#ef4444',
          textShadow: '0 0 8px #ef444499',
          padding: '3px 10px',
          border: '1px solid #ef444466',
          background: 'rgba(0,0,0,0.65)',
        }}
      >
        ⚠ SURFACE LOCK
      </div>
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 9,
          color: '#ef4444aa',
          letterSpacing: '0.1em',
        }}
      >
        GROUND THREAT IN RANGE
      </div>
    </div>
  );
}
