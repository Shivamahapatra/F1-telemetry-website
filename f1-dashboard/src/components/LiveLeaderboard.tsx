"use client";
import { useF1Telemetry } from "@/hooks/useF1Telemetry";

const teamColors: Record<string, string> = {
  VER: "#3671C6", // Red Bull
  PER: "#3671C6",
  HAM: "#FF8000", // McLaren (if he was McLaren) actually HAM is Ferrari in 2025? Let's use generic for now or red: #E80020
  LEC: "#E80020", // Ferrari
  SAI: "#E80020",
  NOR: "#FF8000", // McLaren
  PIA: "#FF8000",
  RUS: "#27F4D2", // Mercedes
  ALO: "#229971", // Aston Martin
};

export default function LiveLeaderboard() {
  const { timingData } = useF1Telemetry();

  return (
    <div className="glass-panel p-4 rounded-2xl h-full flex flex-col w-full overflow-hidden shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider sticky left-0">Live Timing Tower</h2>
      <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
        <div className="grid grid-cols-8 gap-2 text-xs font-bold text-slate-400 uppercase border-b border-slate-700 pb-2 mb-2 sticky top-0 bg-slate-900/80 backdrop-blur-sm z-10">
          <div>POS</div>
          <div>Driver</div>
          <div>Lap</div>
          <div>S1</div>
          <div>S2</div>
          <div>S3</div>
          <div>Gap</div>
          <div>Interval</div>
        </div>
        
        {timingData.length === 0 && (
          <div className="flex items-center gap-2 text-slate-500 py-4 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-[var(--color-neon-red)]"></div>
            Connecting to Live Timing...
          </div>
        )}
        
        {timingData.map((d) => {
          const color = teamColors[d.driver] || "#ffffff";
          return (
            <div key={d.driver} className="grid grid-cols-8 gap-2 text-sm text-slate-200 py-2 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors items-center" style={{ borderLeft: `4px solid ${color}` }}>
              <div className="font-bold text-white bg-slate-800/50 rounded w-6 h-6 flex items-center justify-center ml-2">{d.position}</div>
              <div className="font-black text-white text-lg tracking-wider" style={{ color }}>{d.driver}</div>
              <div className="text-slate-400">{d.lap}</div>
              <div className="text-purple-400 font-mono">{d.s1}</div>
              <div className="text-green-400 font-mono">{d.s2}</div>
              <div className="text-yellow-400 font-mono">{d.s3}</div>
              <div className="font-mono">{d.gapToLeader}</div>
              <div className="font-mono">{d.interval}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
