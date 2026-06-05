"use client";
import React from 'react';
import { useF1Telemetry } from "@/hooks/useF1Telemetry";

const teamColors: Record<string, string> = {
  VER: "#3671C6", PER: "#3671C6",
  HAM: "#E80020", LEC: "#E80020", SAI: "#E80020",
  NOR: "#FF8000", PIA: "#FF8000", 
  RUS: "#27F4D2", 
  ALO: "#229971", STR: "#229971",
  GAS: "#0090FF", OCO: "#0090FF",
  ALB: "#005AFF", SAR: "#005AFF",
  BOT: "#52E252", ZHO: "#52E252",
  MAG: "#FFFFFF", HUL: "#FFFFFF",
  TSU: "#6692FF", RIC: "#6692FF"
};

// Helper for F1 Sector Colors
const getSectorColor = (val: string, index: number) => {
  if (!val) return "text-slate-500";
  // Fake logic for simulation:
  if (index === 0) return "text-[#B138FF]"; // Purple
  if (index % 3 === 0) return "text-[#00D200]"; // Green
  return "text-[#FFD800]"; // Yellow
};

export default function LiveTimingSidebar() {
  const { timingData } = useF1Telemetry();

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-[#0A0D14]">
        <h2 className="text-xl font-black text-white tracking-widest">LIVE TIMING</h2>
        <div className="px-2 py-1 bg-[#B138FF]/20 text-[#B138FF] border border-[#B138FF]/50 rounded text-xs font-bold font-mono">
          FASTEST LAP: 1:12.486
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-[#0F131D] z-10 border-b border-slate-800">
          <div className="w-6 text-center">P</div>
          <div>Driver</div>
          <div className="text-right">Gap</div>
          <div className="text-right">S1</div>
          <div className="text-right">S2</div>
          <div className="text-right">S3</div>
          <div className="w-6 text-center">DRS</div>
        </div>
        
        {timingData.length === 0 && (
          <div className="flex justify-center p-8 text-slate-500 animate-pulse text-xs">Waiting for data...</div>
        )}

        {timingData.map((d, index) => {
          const color = teamColors[d.driver] || "#ffffff";
          return (
            <div key={d.driver} className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-2 py-1.5 items-center border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors group">
              <div className="w-6 text-center font-bold text-slate-300 bg-slate-800/50 rounded py-0.5 text-xs">{d.position}</div>
              
              <div className="font-black tracking-wider text-sm flex items-center gap-2">
                <div className="w-1 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span style={{ color }}>{d.driver}</span>
              </div>
              
              <div className="text-right font-mono text-xs text-slate-300">{d.gapToLeader}</div>
              
              <div className={`text-right font-mono text-xs ${getSectorColor(d.s1, index)}`}>{d.s1}</div>
              <div className={`text-right font-mono text-xs ${getSectorColor(d.s2, index + 1)}`}>{d.s2}</div>
              <div className={`text-right font-mono text-xs ${getSectorColor(d.s3, index + 2)}`}>{d.s3}</div>
              
              <div className="w-6 flex justify-center">
                {index > 0 && index < 5 ? (
                  <span className="w-3 h-3 rounded bg-green-500 flex items-center justify-center text-[8px] font-black text-black">D</span>
                ) : (
                  <span className="w-3 h-3 rounded bg-slate-800"></span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
