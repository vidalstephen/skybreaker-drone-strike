import { useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { RADAR_RANGE } from '../../config/constants';
import { TrackedEntityType, type TrackedEntitySnapshot } from '../../types/game';

export interface RadarProps {
  dronePos:      THREE.Vector3;
  tracks:        TrackedEntitySnapshot[];
  rotationY:     number;
  reduceEffects?: boolean;
  /** Effective radar range in world units. Defaults to RADAR_RANGE constant. */
  radarRange?: number;
}

export function Radar({ dronePos, tracks, rotationY, reduceEffects, radarRange }: RadarProps) {
  const radarR   = 54;
  const svgScale = radarR / (radarRange ?? RADAR_RANGE);
  const clampR   = radarR - 5;

  // Accumulated heading (preserves rotation across renders)
  const prevRotY = useRef(rotationY);
  const accAngle = useRef(0);
  let delta = rotationY - prevRotY.current;
  if (delta >  Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  accAngle.current += delta;
  prevRotY.current  = rotationY;
  const headingDeg  = (accAngle.current * 180) / Math.PI;

  const mapBlip = (wx: number, wz: number) => {
    const dx   = (wx - dronePos.x) * svgScale;
    const dy   = (wz - dronePos.z) * svgScale;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = dist > clampR;
    return {
      x: clamped ? (dx / dist) * clampR : dx,
      y: clamped ? (dy / dist) * clampR : dy,
      clamped,
      fade: clamped ? 0.5 : Math.max(0.5, 1 - (dist / radarR) * 0.35),
    };
  };

  // ---- radar state label ------------------------------------------------
  const active = tracks.filter(t => t.priorityScore >= 0);
  const extractionTrack = active.find(t => t.type === TrackedEntityType.EXTRACTION);
  const enemyTracks     = active.filter(t => t.type === TrackedEntityType.ENEMY);
  const hasAirEnemies   = enemyTracks.some(t => !t.domain || t.domain === 'air');
  const hasGroundEnemies = enemyTracks.some(t => t.domain === 'ground');
  const hasSeaEnemies   = enemyTracks.some(t => t.domain === 'sea');
  const hasEnemies      = enemyTracks.length > 0;
  const hasObjectives   = active.some(t => t.type === TrackedEntityType.OBJECTIVE);
  let radarState = 'SCAN';
  if (extractionTrack) {
    radarState = 'EXTRACT';
  } else if (hasAirEnemies && (hasGroundEnemies || hasSeaEnemies)) {
    radarState = 'MIXED';
  } else if (hasGroundEnemies && !hasAirEnemies) {
    radarState = 'SURFACE';
  } else if (hasSeaEnemies && !hasAirEnemies) {
    radarState = 'NAVAL';
  } else if (hasEnemies) {
    radarState = 'HOSTILES';
  } else if (hasObjectives) {
    radarState = 'TARGETS';
  }

  // Selected track (highest priority)
  const selectedTrack = tracks.find(t => t.isSelected) ?? null;

  // ---- blip renderer ----------------------------------------------------
  const renderBlip = (track: TrackedEntitySnapshot) => {
    const { id, type, isSelected, radarPulse } = track;
    const blip = mapBlip(track.worldX, track.worldZ);
    const { x: bx, y: by, clamped, fade } = blip;
    const pulse = !reduceEffects && (isSelected || radarPulse);

    switch (type) {

      case TrackedEntityType.OBJECTIVE: {
        const color = '#f27d26';
        const r     = track.isRequired ? 2.8 : 2;
        return (
          <g key={id}>
            {track.isRequired && !clamped && (
              <circle cx={bx} cy={by} r={r + 3.5} fill="none" stroke={color} strokeWidth="0.5" opacity={fade * 0.35} />
            )}
            <circle cx={bx} cy={by} r={r} fill={color} opacity={fade} />
            {pulse && (
              <circle cx={bx} cy={by} r={r} fill="none" stroke={color} strokeWidth="0.5">
                <animate attributeName="r"       values={`${r};${r + 6};${r}`}  dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6"              dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      }

      case TrackedEntityType.ENEMY: {
        const color = '#ef4444';
        // Stage 8b: wing blips render at reduced size to differentiate from leaders/solos
        const isWing = track.formationRole === 'wing';
        const half  = isWing ? 1.4 : 2;
        const blipFade = isWing ? fade * 0.72 : fade;
        // Stage 5f: blip shape reflects combat domain
        // ground threat → inverted triangle (▽); sea threat → diamond (◇); air (default) → square (□)
        if (track.domain === 'ground') {
          const d = isWing ? 2.0 : 2.8;
          const pts = `${bx},${by + d} ${bx - d},${by - d * 0.7} ${bx + d},${by - d * 0.7}`;
          return (
            <g key={id}>
              <polygon points={pts} fill={color} opacity={blipFade} />
              {isSelected && !clamped && (
                <polygon
                  points={`${bx},${by + d + 2.5} ${bx - d - 2.5},${by - d * 0.7 - 1.5} ${bx + d + 2.5},${by - d * 0.7 - 1.5}`}
                  fill="none" stroke={color} strokeWidth="0.6" opacity={blipFade * 0.7}
                />
              )}
              {pulse && (
                <circle cx={bx} cy={by} r={d} fill="none" stroke={color} strokeWidth="0.5">
                  <animate attributeName="r"       values={`${d};${d + 7};${d}`} dur="0.9s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5"             dur="0.9s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        }
        if (track.domain === 'sea') {
          const d = isWing ? 2.0 : 2.8;
          const pts = `${bx},${by - d} ${bx + d},${by} ${bx},${by + d} ${bx - d},${by}`;
          return (
            <g key={id}>
              <polygon points={pts} fill={color} opacity={blipFade} />
              {isSelected && !clamped && (
                <polygon
                  points={`${bx},${by - d - 2.5} ${bx + d + 2.5},${by} ${bx},${by + d + 2.5} ${bx - d - 2.5},${by}`}
                  fill="none" stroke={color} strokeWidth="0.6" opacity={blipFade * 0.7}
                />
              )}
              {pulse && (
                <circle cx={bx} cy={by} r={d} fill="none" stroke={color} strokeWidth="0.5">
                  <animate attributeName="r"       values={`${d};${d + 7};${d}`} dur="0.9s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5"             dur="0.9s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        }
        // Air (default): red square — wings are smaller (half already scaled above)
        return (
          <g key={id}>
            <rect x={bx - half} y={by - half} width={half * 2} height={half * 2} fill={color} opacity={blipFade} />
            {isSelected && !clamped && (
              <rect x={bx - half - 2} y={by - half - 2} width={half * 2 + 4} height={half * 2 + 4}
                fill="none" stroke={color} strokeWidth="0.6" opacity={blipFade * 0.7} />
            )}
            {pulse && (
              <circle cx={bx} cy={by} r={half} fill="none" stroke={color} strokeWidth="0.5">
                <animate attributeName="r"       values={`${half};${half + 7};${half}`} dur="0.9s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5"                     dur="0.9s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      }

      case TrackedEntityType.EXTRACTION: {
        const color = '#10b981';
        const d     = 3.5;
        const pts   = `${bx},${by - d} ${bx + d},${by} ${bx},${by + d} ${bx - d},${by}`;
        // Outward edge-pin arrow for clamped extraction
        let edgePin: ReactNode = null;
        if (clamped) {
          const len = Math.sqrt(bx * bx + by * by);
          if (len > 0.001) {
            const nx = bx / len, ny = by / len;
            const px = -ny * 2.2, py = nx * 2.2;
            const tipX = (bx + nx * 5).toFixed(1);
            const tipY = (by + ny * 5).toFixed(1);
            const b1x  = (bx + nx * 1 + px).toFixed(1);
            const b1y  = (by + ny * 1 + py).toFixed(1);
            const b2x  = (bx + nx * 1 - px).toFixed(1);
            const b2y  = (by + ny * 1 - py).toFixed(1);
            edgePin = <polygon points={`${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`} fill={color} opacity={0.9} />;
          }
        }
        return (
          <g key={id}>
            <polygon points={pts} fill={color} opacity={fade} />
            {!clamped && (
              <circle cx={bx} cy={by} r={d + 3.5} fill="none" stroke={color} strokeWidth="0.75" opacity={fade * 0.45} />
            )}
            {!reduceEffects && (
              <circle cx={bx} cy={by} r={d + 2} fill="none" stroke={color} strokeWidth="0.6">
                <animate attributeName="r"       values={`${d + 2};${d + 10};${d + 2}`} dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0;0.7"                      dur="1.2s" repeatCount="indefinite" />
              </circle>
            )}
            {edgePin}
          </g>
        );
      }

      case TrackedEntityType.HAZARD: {
        const color = '#f59e0b';
        const d     = 2.5;
        return (
          <g key={id}>
            <line x1={bx - d} y1={by - d} x2={bx + d} y2={by + d} stroke={color} strokeWidth="1" strokeLinecap="round" opacity={fade * 0.65} />
            <line x1={bx + d} y1={by - d} x2={bx - d} y2={by + d} stroke={color} strokeWidth="1" strokeLinecap="round" opacity={fade * 0.65} />
          </g>
        );
      }

      case TrackedEntityType.WEAK_POINT: {
        const color = '#f27d26';
        const d     = 2.5;
        return (
          <g key={id}>
            <polygon
              points={`${bx},${by - d} ${bx - d * 0.8},${by + d * 0.6} ${bx + d * 0.8},${by + d * 0.6}`}
              fill={color} opacity={fade * 0.75}
            />
          </g>
        );
      }

      default:
        return null;
    }
  };

  // ---- selected-track radial connector ----------------------------------
  const renderConnector = () => {
    if (!selectedTrack) return null;
    const blip  = mapBlip(selectedTrack.worldX, selectedTrack.worldZ);
    const color =
      selectedTrack.type === TrackedEntityType.ENEMY      ? '#ef4444' :
      selectedTrack.type === TrackedEntityType.EXTRACTION ? '#10b981' : '#f27d26';
    return (
      <line
        x1="0" y1="0" x2={blip.x} y2={blip.y}
        stroke={color} strokeWidth="0.4" strokeDasharray="2 3" opacity={0.32}
      />
    );
  };

  // -----------------------------------------------------------------------

  return (
    <>
      <div
        className="relative rounded-full backdrop-blur-md overflow-hidden"
        style={{
          width: 128, height: 128,
          background:  'radial-gradient(circle, rgba(0,10,6,0.96) 0%, rgba(0,5,3,0.99) 100%)',
          boxShadow:   '0 0 0 1px rgba(242,125,38,0.22), 0 0 18px rgba(0,0,0,0.85), inset 0 0 28px rgba(0,0,0,0.55)',
        }}
      >
        <svg className="absolute inset-0" width="128" height="128" viewBox="-64 -64 128 128">
          {/* Grid rings */}
          <circle cx="0" cy="0" r={radarR * 0.34} fill="none" stroke="rgba(242,125,38,0.07)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r={radarR * 0.67} fill="none" stroke="rgba(242,125,38,0.07)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r={radarR}         fill="none" stroke="rgba(242,125,38,0.22)" strokeWidth="1" />

          {/* Cardinal tick marks */}
          {[0, 90, 180, 270].map(deg => {
            const angle = (deg - 90) * Math.PI / 180;
            const cx1 = Math.cos(angle) * (radarR - 5);
            const cy1 = Math.sin(angle) * (radarR - 5);
            const cx2 = Math.cos(angle) * (radarR + 1);
            const cy2 = Math.sin(angle) * (radarR + 1);
            return <line key={deg} x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke="rgba(242,125,38,0.4)" strokeWidth="1.5" strokeLinecap="round" />;
          })}

          {/* Rotating world group (heading-locked) */}
          <g style={{ transform: `rotate(${headingDeg}deg)`, transformOrigin: '0px 0px', transition: 'transform 80ms linear' }}>
            {/* Selected-track connector (below blips) */}
            {renderConnector()}

            {/* All tracked entities */}
            {tracks.map(renderBlip)}

            {/* Cardinal labels */}
            <text x="0"            y={-(radarR - 10)} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.38)" fontSize="6" fontWeight="bold" fontFamily="monospace">N</text>
            <text x="0"            y={  radarR - 10}  textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.14)" fontSize="5" fontFamily="monospace">S</text>
            <text x={  radarR - 10} y="0"             textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.14)" fontSize="5" fontFamily="monospace">E</text>
            <text x={-(radarR - 10)} y="0"            textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.14)" fontSize="5" fontFamily="monospace">W</text>
          </g>

          {/* Player drone (static center) */}
          <circle cx="0" cy="0" r="8" fill="rgba(0,200,180,0.10)" />
          <path d="M0,-7.5 L-3.5,4.5 L0,2.5 L3.5,4.5 Z" fill="#00ffff" fillOpacity="0.88" stroke="#00ffff" strokeWidth="0.5" strokeLinejoin="round" />
        </svg>

        {/* Sweep animation overlay */}
        <div className="absolute inset-0 rounded-full pointer-events-none animate-[spin_4s_linear_infinite]"
          style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,210,160,0.07) 38deg, transparent 39deg)' }} />
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: 'inset 0 0 18px rgba(0,0,0,0.55)' }} />
      </div>

      {/* Radar state label — below the circle, scales with parent */}
      <div className="mt-0.5 text-center font-mono text-[7px] tracking-[0.18em] text-white/38 select-none pointer-events-none uppercase">
        {radarState}
      </div>

      {/* Stage 5f: routing hint — shown when the selected track has authored route metadata */}
      {selectedTrack?.routeHint && (
        <div
          className="mt-0.5 max-w-[130px] text-center font-mono text-[6px] tracking-[0.12em] select-none pointer-events-none uppercase leading-tight"
          style={{ color: 'rgba(242,125,38,0.55)' }}
        >
          {selectedTrack.routeHint}
        </div>
      )}
    </>
  );
}

