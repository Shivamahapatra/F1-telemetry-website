"use client";
import React from 'react';
import { useF1Telemetry } from "@/hooks/useF1Telemetry";

const TEAM_COLORS: Record<string, string> = {
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

// Mock historical data for offline state
const OFFLINE_STANDINGS = [
    { pos: 1, driver: 'LEC', best: '1:13.978', interval: '-', last: 'IN PIT', tire: 'M', age: 3 },
    { pos: 2, driver: 'HAM', best: '1:14.204', interval: '+0.226', last: 'IN PIT', tire: 'M', age: 2 },
    { pos: 3, driver: 'VER', best: '1:14.491', interval: '+0.513', last: 'IN PIT', tire: 'M', age: 2 },
    { pos: 4, driver: 'SAI', best: '1:14.537', interval: '+0.559', last: 'IN PIT', tire: 'H', age: 2 },
    { pos: 5, driver: 'RUS', best: '1:14.983', interval: '+1.005', last: 'IN PIT', tire: 'M', age: 2 },
    { pos: 6, driver: 'NOR', best: '1:15.291', interval: '+1.313', last: 'IN PIT', tire: 'H', age: 2 },
    { pos: 7, driver: 'HUL', best: '1:15.343', interval: '+1.365', last: 'IN PIT', tire: 'M', age: 2 },
    { pos: 8, driver: 'PIA', best: '1:15.565', interval: '+1.587', last: 'IN PIT', tire: 'S', age: 4 },
    { pos: 9, driver: 'BOT', best: '1:15.750', interval: '+1.772', last: 'IN PIT', tire: 'M', age: 3 },
    { pos: 10, driver: 'GAS', best: '1:15.828', interval: '+1.850', last: 'IN PIT', tire: 'M', age: 2 },
    { pos: 11, driver: 'ALB', best: '1:15.989', interval: '+2.011', last: 'IN PIT', tire: 'M', age: 2 },
    { pos: 12, driver: 'ALO', best: '1:16.041', interval: '+2.063', last: 'IN PIT', tire: 'M', age: 2 },
    { pos: 13, driver: 'STR', best: '1:16.148', interval: '+2.170', last: 'IN PIT', tire: 'H', age: 1 },
    { pos: 14, driver: 'PER', best: '1:16.170', interval: '+2.192', last: 'IN PIT', tire: 'S', age: 4 },
    { pos: 15, driver: 'MAG', best: '1:16.189', interval: '+2.211', last: 'IN PIT', tire: 'M', age: 2 },
];

export default function LiveTimingSidebar() {
  const { timingData } = useF1Telemetry();
  
  const isOffline = timingData.length === 0;

  return (
    <div className="flex flex-col h-full bg-[#0A0D14]">
      {/* Top Header Tabs */}
      <div className="flex bg-[#0F131D] border-b border-slate-800 p-2 gap-2 text-xs font-bold text-slate-500 tracking-widest uppercase">
          <div className="px-6 py-2 border border-slate-600 rounded bg-slate-800/50 text-white cursor-pointer hover:bg-slate-700">LAP</div>
          <div className="px-6 py-2 border border-transparent cursor-pointer hover:text-white">SECTOR</div>
          <div className="px-6 py-2 border border-transparent cursor-pointer hover:text-white">TIRE</div>
          <div className="px-6 py-2 border border-transparent cursor-pointer hover:text-white">CAR</div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[20px_60px_1fr_1fr_1fr_2fr_40px] gap-2 px-4 py-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 tracking-widest uppercase min-w-[600px]">
        <div></div>
        <div>DRIVER</div>
        <div className="text-right">BEST</div>
        <div className="text-right">INTERVAL</div>
        <div className="text-center">LAST</div>
        <div className="text-center">MINI SECTOR</div>
        <div className="text-center">TIRE</div>
      </div>

      {/* Driver List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 min-w-[600px]">
        {isOffline ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mb-4"></div>
                <p className="font-bold tracking-widest text-xs uppercase">Connecting to F1 Live Timing...</p>
                <p className="text-[10px] mt-2 max-w-xs text-center">If the session is active, the leaderboard will populate as cars set new sector times.</p>
            </div>
        ) : (
            timingData.map((d, i) => (
              <div key={d.driver} className="grid grid-cols-[20px_60px_1fr_1fr_1fr_2fr_40px] items-center gap-2 py-1 px-2 hover:bg-slate-800/50 rounded group">
                <span className="text-slate-500 font-bold text-xs">{i + 1}</span>
                <div className="flex items-center gap-2">
                  <div className="w-[3px] h-4 rounded" style={{ backgroundColor: d.teamColor || TEAM_COLORS[d.driver] || '#fff' }}></div>
                  <span className="text-slate-300 font-bold tracking-wider">{d.driver}</span>
                </div>
                <span className="text-[var(--color-neon-green)] font-mono text-xs text-right font-bold">{d.bestLap ? d.bestLap : '-'}</span>
                
                <div className="flex flex-col items-end leading-tight">
                    <span className="text-white font-mono text-xs font-bold">{d.gapToLeader || '-'}</span>
                    {i > 0 && d.interval && <span className="text-[10px] text-blue-400 font-mono">{d.interval}</span>}
                </div>

                <div className="text-center">
                    {d.pitStatus ? (
                        <span className="bg-red-900/50 text-red-500 border border-red-800/50 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest">{d.pitStatus}</span>
                    ) : (
                        <span className="text-slate-300 font-mono text-xs text-center font-bold">{d.lastLap || '-'}</span>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center gap-1">
                    {!d.pitStatus && d.s1 && d.s2 && d.s3 ? (
                      <div className="flex justify-between w-full px-2 text-[9px] font-mono font-bold">
                          <span className="text-yellow-500">{d.s1}</span>
                          <span className="text-green-500">{d.s2}</span>
                          <span className="text-purple-500">{d.s3}</span>
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-600 font-bold">-</div>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center gap-0.5">
                    {d.tire ? (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2
                          ${d.tire === 'SOFT' ? 'border-red-500 text-red-500' : d.tire === 'MEDIUM' ? 'border-yellow-500 text-yellow-500' : 'border-white text-white'}`}>
                          {d.tire[0]}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-600 font-bold">-</div>
                    )}
                    <span className="text-[9px] text-slate-500 font-mono">{(i%3)+2}L</span>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
