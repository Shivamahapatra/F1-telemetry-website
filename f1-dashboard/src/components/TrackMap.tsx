"use client";

export default function TrackMap() {
  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider">Sector Analysis</h2>
      <div className="flex-1 flex items-center justify-center p-4 relative min-h-[250px]">
        <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          {/* Abstract Track Shape */}
          <path d="M 50 100 C 20 100 20 50 50 50 L 150 50 C 180 50 180 100 150 100 Z" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
          
          {/* Sector 1 - VER faster */}
          <path d="M 50 100 C 20 100 20 50 50 50 L 100 50" fill="none" stroke="var(--color-neon-blue)" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0px 0px 4px var(--color-neon-blue))' }} />
          
          {/* Sector 2 - HAM faster */}
          <path d="M 100 50 L 150 50 C 180 50 180 80 170 95" fill="none" stroke="var(--color-neon-green)" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0px 0px 4px var(--color-neon-green))' }} />
          
          {/* Sector 3 - VER faster */}
          <path d="M 170 95 C 165 100 160 100 150 100 L 50 100" fill="none" stroke="var(--color-neon-blue)" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0px 0px 4px var(--color-neon-blue))' }} />
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded">
            <div className="w-3 h-3 rounded-full shadow-[0_0_5px_var(--color-neon-blue)]" style={{ backgroundColor: 'var(--color-neon-blue)' }}></div>
            <span className="text-slate-300">VER Faster</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded">
            <div className="w-3 h-3 rounded-full shadow-[0_0_5px_var(--color-neon-green)]" style={{ backgroundColor: 'var(--color-neon-green)' }}></div>
            <span className="text-slate-300">HAM Faster</span>
          </div>
        </div>
      </div>
    </div>
  );
}
