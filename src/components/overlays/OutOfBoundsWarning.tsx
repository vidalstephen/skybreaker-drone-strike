export function OutOfBoundsWarning() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-red-900/10 pointer-events-none animate-pulse">
      <div className="text-red-500 font-black text-2xl tracking-[0.5em] border-2 border-red-500 px-8 py-4 bg-black/80">
        WARNING: LEAVING MISSION ZONE // TURN BACK
      </div>
    </div>
  );
}
