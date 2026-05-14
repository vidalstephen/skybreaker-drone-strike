export interface CompassProps {
  rotationY: number;
}

export function Compass({ rotationY }: CompassProps) {
  let degrees = (-rotationY * (180 / Math.PI)) % 360;
  if (degrees < 0) degrees += 360;

  const marks = [];
  for (let i = 0; i < 360; i += 15) {
    let label = i.toString();
    if (i === 0) label = 'N';
    if (i === 90) label = 'E';
    if (i === 180) label = 'S';
    if (i === 270) label = 'W';
    marks.push({ degrees: i, label });
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-44 h-7 overflow-hidden border-x border-white/20 mask-gradient-x sm:w-56 md:w-64 md:h-8">
        <div
          className="absolute top-0 flex items-end h-full transition-transform duration-75 ease-linear"
          style={{ transform: `translateX(calc(50% - ${degrees * 2}px))` }}
        >
          {[-1, 0, 1].map(offset => (
            <div key={offset} className="flex absolute top-0" style={{ left: `${offset * 720}px` }}>
              {marks.map(mark => (
                <div key={mark.degrees} className="flex flex-col items-center justify-end w-[30px] h-full pb-1">
                  <span className={`text-[10px] font-mono font-bold ${mark.label.length > 1 ? 'text-white/40' : 'text-orange-500'}`}>
                    {mark.label}
                  </span>
                  <div className={`w-px ${mark.label.length > 1 ? 'h-1 bg-white/20' : 'h-2 bg-orange-500'}`} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-orange-500 shadow-[0_0_8px_rgba(242,125,38,1)] z-10" />
      </div>
      <div className="text-[9px] font-mono text-white/60 tracking-widest px-2 sm:text-[10px]">
        {Math.round(degrees).toString().padStart(3, '0')}&deg;
      </div>
    </div>
  );
}
