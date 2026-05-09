import * as THREE from 'three';
import type { Target } from '../../types/game';

export interface MarkerScreenPosition {
  x: number;
  y: number;
  visible: boolean;
  offScreen?: boolean;
  angle?: number;
}

export interface TargetMarkersProps {
  targets: Target[];
  dronePosition?: THREE.Vector3;
  lockedTargetId: string | null;
  extractionActive: boolean;
  extractionScreenPosition: MarkerScreenPosition;
  extractionPosition?: THREE.Vector3 | null;
  onToggleLock: (id: string) => void;
}

function DirectionArrow({ color, angle }: { color: string; angle?: number }) {
  return (
    <div className={`${color} font-mono text-[10px] font-bold mt-1`} style={{ transform: `rotate(${angle || 0}rad)` }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2.5">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  );
}

function MarkerBrackets({ color }: { color: 'orange' | 'emerald' }) {
  const borderClass = color === 'orange' ? 'border-orange-500/80' : 'border-emerald-500/80';
  const dotClass = color === 'orange' ? 'bg-orange-500/80' : 'bg-emerald-500/80';

  return (
    <>
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${borderClass}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${borderClass}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${borderClass}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${borderClass}`} />
      <div className={`w-1 h-1 ${dotClass}`} />
    </>
  );
}

export function TargetMarkers({ targets, dronePosition, lockedTargetId, extractionActive, extractionScreenPosition, extractionPosition, onToggleLock }: TargetMarkersProps) {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-30">
        {targets.map(target => (
          !target.destroyed && target.screenPos?.visible && (
            <div
              key={target.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 transition-all duration-300 pointer-events-auto cursor-pointer ${target.screenPos.offScreen ? 'opacity-70 scale-90' : 'opacity-100 scale-100'}`}
              style={{ left: target.screenPos.x, top: target.screenPos.y }}
              onClick={event => {
                event.stopPropagation();
                onToggleLock(target.id);
              }}
            >
              <div className={`relative flex items-center justify-center ${target.screenPos.offScreen ? 'w-6 h-6' : 'w-10 h-10'} ${lockedTargetId === target.id ? 'ring-2 ring-orange-500/50 animate-pulse' : ''}`}>
                {!target.screenPos.offScreen ? <MarkerBrackets color="orange" /> : <DirectionArrow color="text-orange-500" angle={target.screenPos.angle} />}
              </div>
              {!target.screenPos.offScreen && (
                <div className="bg-black/80 px-1.5 py-0.5 border border-orange-500/20 backdrop-blur-sm mt-0.5">
                  <div className="text-[8px] font-mono text-orange-500 tracking-widest font-bold">TGT_{target.id.split('_')[1]}</div>
                  <div className="text-[8px] font-mono text-white/70 font-medium">{Math.round(dronePosition?.distanceTo(target.position) || 0)}m</div>
                </div>
              )}
              {target.screenPos.offScreen && (
                <div className="text-[7px] font-mono text-orange-400 bg-black/60 px-1 mt-1 border border-orange-500/20">{Math.round(dronePosition?.distanceTo(target.position) || 0)}m</div>
              )}
            </div>
          )
        ))}
      </div>

      {extractionActive && extractionScreenPosition.visible && extractionPosition && (
        <div
          className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-30 transition-all duration-300 pointer-events-auto cursor-pointer ${extractionScreenPosition.offScreen ? 'opacity-70 scale-90' : 'opacity-100 scale-100'}`}
          style={{ left: extractionScreenPosition.x, top: extractionScreenPosition.y }}
          onClick={event => {
            event.stopPropagation();
            onToggleLock('EXTRACTION');
          }}
        >
          <div className={`relative flex items-center justify-center ${extractionScreenPosition.offScreen ? 'w-6 h-6' : 'w-10 h-10'} ${lockedTargetId === 'EXTRACTION' ? 'ring-2 ring-emerald-500/50 animate-pulse' : ''}`}>
            {!extractionScreenPosition.offScreen ? <MarkerBrackets color="emerald" /> : <DirectionArrow color="text-emerald-500" angle={extractionScreenPosition.angle} />}
          </div>
          {!extractionScreenPosition.offScreen && (
            <div className="bg-black/80 px-1.5 py-0.5 border border-emerald-500/20 backdrop-blur-sm mt-0.5 flex flex-col items-center">
              <div className="text-[8px] font-mono text-emerald-500 tracking-widest font-bold uppercase">Extraction</div>
              <div className="text-[8px] font-mono text-white/70 font-medium">{Math.round(dronePosition?.distanceTo(extractionPosition) || 0)}m</div>
            </div>
          )}
          {extractionScreenPosition.offScreen && (
            <div className="text-[7px] font-mono text-emerald-400 bg-black/60 px-1 mt-1 border border-emerald-500/20">{Math.round(dronePosition?.distanceTo(extractionPosition) || 0)}m</div>
          )}
        </div>
      )}
    </>
  );
}
