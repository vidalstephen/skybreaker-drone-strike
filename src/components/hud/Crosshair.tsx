import {
  AIM_PATH_OPACITY_IDLE,
  AIM_PATH_OPACITY_FIRING,
  AIM_PATH_WIDTH,
  AIM_PATH_DASH,
  AIM_PATH_FADE_MS,
  RETICLE_PULSE_MS,
} from '../../config/constants';
import type { CameraMode } from '../../types/game';

export interface CrosshairProps {
  cameraMode: CameraMode;
  boosting: boolean;
  aligned?: boolean;
  recoil?: boolean;
  firing?: boolean;
  hitConfirmed?: boolean;
  aimScreenPos?: { x: number; y: number };
  droneScreenPos?: { x: number; y: number };
}

export function Crosshair({ cameraMode, boosting, aligned, recoil, firing, hitConfirmed, aimScreenPos, droneScreenPos }: CrosshairProps) {
  const pathOpacity = firing ? AIM_PATH_OPACITY_FIRING : AIM_PATH_OPACITY_IDLE;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {cameraMode === 'COCKPIT' && (
        <div className="absolute inset-0 border-[60px] border-black/20 pointer-events-none">
          <div className="absolute inset-0 border-[1px] border-white/10" />
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-orange-500/40 to-transparent" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-t from-orange-500/40 to-transparent" />
          <div className="absolute top-1/4 left-20 text-[8px] font-mono text-orange-500/60 uppercase">ALT_READY: TRUE</div>
          <div className="absolute top-1/4 right-20 text-[8px] font-mono text-orange-500/60 uppercase text-right">MAG_LOCK: ACTIVE</div>
        </div>
      )}
      <div className="relative w-32 h-32">
        {/* Main reticle ring */}
        <div className={`absolute inset-0 border rounded-full transition-all duration-300 ${boosting ? 'animate-pulse scale-110 opacity-70 border-orange-500/30' : aligned ? 'border-orange-400/60 scale-95 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border-orange-500/30'}`} />
        {/* Cardinal ticks */}
        <div className={`absolute top-1/2 left-0 h-px bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] transition-all ${recoil ? 'w-4 translate-x-3' : 'w-6'}`} />
        <div className={`absolute top-1/2 right-0 h-px bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] transition-all ${recoil ? 'w-4 -translate-x-3' : 'w-6'}`} />
        <div className={`absolute top-0 left-1/2 w-px bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] transition-all ${recoil ? 'h-4 translate-y-3' : 'h-6'}`} />
        <div className={`absolute bottom-0 left-1/2 w-px bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] transition-all ${recoil ? 'h-4 -translate-y-3' : 'h-6'}`} />
        {/* Center aim dot — always visible as a precise aim point, pulses on recoil/firing */}
        <div
          className="absolute inset-0 m-auto rounded-full bg-orange-500 transition-all"
          style={{
            width: 6,
            height: 6,
            opacity: (recoil || firing) ? 0.9 : 0.25,
            transform: `scale(${(recoil || firing) ? 1.5 : 0.9})`,
            transitionDuration: (recoil || firing) ? '60ms' : `${Math.max(AIM_PATH_FADE_MS, RETICLE_PULSE_MS)}ms`,
            boxShadow: (recoil || firing) ? '0 0 8px rgba(249,115,22,0.8)' : 'none',
          }}
        />
        {/* Hit-confirmed flash */}
        <div className={`absolute inset-0 m-auto w-10 h-10 pointer-events-none transform rotate-45 transition-all duration-100 ${hitConfirmed ? 'scale-100 opacity-90' : 'scale-75 opacity-0'}`}>
          <div className="absolute top-1/2 left-1 w-3 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.9)]" />
          <div className="absolute top-1/2 right-1 w-3 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.9)]" />
          <div className="absolute top-1 left-1/2 w-[2px] h-3 bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.9)]" />
          <div className="absolute bottom-1 left-1/2 w-[2px] h-3 bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.9)]" />
        </div>
      </div>

      {/* Tactical projected weapon path — drone nose to reticle aim point */}
      {aimScreenPos && droneScreenPos && cameraMode === 'CHASE' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="weaponPathGradient" gradientUnits="userSpaceOnUse" x1={droneScreenPos.x} y1={droneScreenPos.y} x2={aimScreenPos.x} y2={aimScreenPos.y}>
              <stop offset="0%"   stopColor="#f97316" stopOpacity="0" />
              <stop offset="25%"  stopColor="#f97316" stopOpacity={pathOpacity * 0.2} />
              <stop offset="75%"  stopColor="#f97316" stopOpacity={pathOpacity * 0.7} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={pathOpacity} />
            </linearGradient>
          </defs>
          <line
            x1={droneScreenPos.x}
            y1={droneScreenPos.y}
            x2={aimScreenPos.x}
            y2={aimScreenPos.y}
            stroke="url(#weaponPathGradient)"
            strokeWidth={AIM_PATH_WIDTH}
            strokeDasharray={AIM_PATH_DASH}
            strokeLinecap="round"
            style={{ transition: `opacity ${AIM_PATH_FADE_MS}ms linear` }}
          />
        </svg>
      )}
    </div>
  );
}
