import { useRef } from 'react';
import * as THREE from 'three';
import { RADAR_RANGE } from '../../config/constants';
import type { Enemy, Target } from '../../types/game';

export interface RadarProps {
  dronePos: THREE.Vector3;
  targets: Target[];
  enemies: Enemy[];
  rotationY: number;
  extractionPos?: THREE.Vector3 | null;
  extractionActive?: boolean;
}

export function Radar({ dronePos, targets, enemies, rotationY, extractionPos, extractionActive }: RadarProps) {
  const radarR = 54;
  const svgScale = radarR / RADAR_RANGE;
  const clampR = radarR - 5;

  const prevRotY = useRef(rotationY);
  const accAngle = useRef(0);
  let delta = rotationY - prevRotY.current;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  accAngle.current += delta;
  prevRotY.current = rotationY;
  const headingDeg = (accAngle.current * 180) / Math.PI;

  const mapBlip = (worldPos: THREE.Vector3) => {
    const dx = (worldPos.x - dronePos.x) * svgScale;
    const dy = (worldPos.z - dronePos.z) * svgScale;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = dist > clampR;
    return {
      x: clamped ? (dx / dist) * clampR : dx,
      y: clamped ? (dy / dist) * clampR : dy,
      clamped,
      fade: clamped ? 0.45 : Math.max(0.5, 1 - (dist / radarR) * 0.35),
    };
  };

  return (
    <div
      className="relative rounded-full backdrop-blur-md overflow-hidden"
      style={{
        width: 128,
        height: 128,
        background: 'radial-gradient(circle, rgba(0,10,6,0.96) 0%, rgba(0,5,3,0.99) 100%)',
        boxShadow: '0 0 0 1px rgba(242,125,38,0.22), 0 0 18px rgba(0,0,0,0.85), inset 0 0 28px rgba(0,0,0,0.55)',
      }}
    >
      <svg className="absolute inset-0" width="128" height="128" viewBox="-64 -64 128 128">
        <circle cx="0" cy="0" r={radarR * 0.34} fill="none" stroke="rgba(242,125,38,0.07)" strokeWidth="0.5" />
        <circle cx="0" cy="0" r={radarR * 0.67} fill="none" stroke="rgba(242,125,38,0.07)" strokeWidth="0.5" />
        <circle cx="0" cy="0" r={radarR} fill="none" stroke="rgba(242,125,38,0.22)" strokeWidth="1" />

        {[0, 90, 180, 270].map(deg => {
          const angle = (deg - 90) * Math.PI / 180;
          const cx1 = Math.cos(angle) * (radarR - 5);
          const cy1 = Math.sin(angle) * (radarR - 5);
          const cx2 = Math.cos(angle) * (radarR + 1);
          const cy2 = Math.sin(angle) * (radarR + 1);
          return <line key={deg} x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke="rgba(242,125,38,0.4)" strokeWidth="1.5" strokeLinecap="round" />;
        })}

        <g style={{ transform: `rotate(${headingDeg}deg)`, transformOrigin: '0px 0px', transition: 'transform 80ms linear' }}>
          {targets.filter(target => !target.destroyed).map(target => {
            const blip = mapBlip(target.position);
            return (
              <g key={target.id}>
                <circle cx={blip.x} cy={blip.y} r={blip.clamped ? 2 : 2.5} fill="#f27d26" opacity={blip.fade} />
                {!blip.clamped && <circle cx={blip.x} cy={blip.y} r="5.5" fill="none" stroke="#f27d26" strokeWidth="0.5" opacity={blip.fade * 0.35} />}
              </g>
            );
          })}

          {enemies.filter(enemy => !enemy.destroyed).map((enemy, index) => {
            const blip = mapBlip(enemy.mesh.position);
            return <rect key={index} x={blip.x - 2} y={blip.y - 2} width="4" height="4" fill="#ef4444" opacity={blip.fade} />;
          })}

          {extractionActive && extractionPos && (() => {
            const blip = mapBlip(extractionPos);
            return (
              <g>
                <circle cx={blip.x} cy={blip.y} r="3" fill="#10b981" opacity={blip.fade} />
                <circle cx={blip.x} cy={blip.y} r="6.5" fill="none" stroke="#10b981" strokeWidth="0.75" opacity={blip.fade * 0.45} />
              </g>
            );
          })()}

          <text x="0" y={-(radarR - 10)} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.38)" fontSize="6" fontWeight="bold" fontFamily="monospace">N</text>
          <text x="0" y={radarR - 10} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.14)" fontSize="5" fontFamily="monospace">S</text>
          <text x={radarR - 10} y="0" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.14)" fontSize="5" fontFamily="monospace">E</text>
          <text x={-(radarR - 10)} y="0" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.14)" fontSize="5" fontFamily="monospace">W</text>
        </g>

        <circle cx="0" cy="0" r="8" fill="rgba(0,200,180,0.10)" />
        <path d="M0,-7.5 L-3.5,4.5 L0,2.5 L3.5,4.5 Z" fill="#00ffff" fillOpacity="0.88" stroke="#00ffff" strokeWidth="0.5" strokeLinejoin="round" />
      </svg>

      <div className="absolute inset-0 rounded-full pointer-events-none animate-[spin_4s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,210,160,0.07) 38deg, transparent 39deg)' }} />
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: 'inset 0 0 18px rgba(0,0,0,0.55)' }} />
    </div>
  );
}
