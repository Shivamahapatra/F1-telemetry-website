"use client";
import React, { useState } from 'react';
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

export default function LiveTimingSidebar() {
  const { timingData } = useF1Telemetry();
  const [activeTab, setActiveTab] = useState<'LAP' | 'SECTOR' | 'TIRE' | 'CAR'>('LAP');
  
  const isOffline = timingData.length === 0;

  return (
    <div className="flex flex-col h-full bg-[#0A0D14]">
      {/* Top Header Tabs */}
      <div className="flex bg-[#0F131D] border-b border-slate-800 p-2 gap-2 text-xs font-bold text-slate-500 tracking-widest uppercase shrink-0">
          {['LAP', 'SECTOR', 'TIRE', 'CAR'].map((tab) => (
              <div
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-2 border rounded cursor-pointer transition-all duration-200 ${
                      activeTab === tab
                          ? 'border-slate-600 bg-slate-800/50 text-white font-extrabold shadow'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
              >
                  {tab}
              </div>
          ))}
      </div>

      {/* Dynamic Column Headers */}
      {activeTab === 'LAP' && (
        <div className="grid grid-cols-[20px_60px_1fr_1fr_1fr_2fr_40px] gap-2 px-4 py-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 tracking-widest uppercase min-w-[600px] shrink-0">
          <div></div>
          <div>DRIVER</div>
          <div className="text-right">BEST</div>
          <div className="text-right">INTERVAL</div>
          <div className="text-center">LAST</div>
          <div className="text-center">MINI SECTOR</div>
          <div className="text-center">TIRE</div>
        </div>
      )}
      {activeTab === 'SECTOR' && (
        <div className="grid grid-cols-[20px_60px_1fr_1fr_1fr_1.2fr_1.2fr_1.2fr] gap-2 px-4 py-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 tracking-widest uppercase min-w-[600px] shrink-0">
          <div></div>
          <div>DRIVER</div>
          <div className="text-right">BEST</div>
          <div className="text-right">INTERVAL</div>
          <div className="text-center">LAST</div>
          <div className="text-center">S1 / BEST</div>
          <div className="text-center">S2 / BEST</div>
          <div className="text-center">S3 / BEST</div>
        </div>
      )}
      {activeTab === 'TIRE' && (
        <div className="grid grid-cols-[20px_60px_110px_1fr] gap-4 px-4 py-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 tracking-widest uppercase min-w-[600px] shrink-0">
          <div></div>
          <div>DRIVER</div>
          <div className="text-left">TIRE INFO</div>
          <div className="text-center">TIRE LIFE PROGRESS</div>
        </div>
      )}
      {activeTab === 'CAR' && (
        <div className="grid grid-cols-[20px_60px_1.5fr_50px_1.5fr_60px_60px] gap-2 px-4 py-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 tracking-widest uppercase min-w-[600px] shrink-0">
          <div></div>
          <div>DRIVER</div>
          <div className="text-left">SPEED (KM/H)</div>
          <div className="text-center">GEAR</div>
          <div className="text-left">THROTTLE</div>
          <div className="text-center">BRAKE</div>
          <div className="text-center">DRS</div>
        </div>
      )}

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
              <div 
                key={d.driver} 
                className={`items-center gap-2 py-1 px-2 hover:bg-slate-800/50 rounded group grid ${
                  activeTab === 'LAP' ? 'grid-cols-[20px_60px_1fr_1fr_1fr_2fr_40px]' :
                  activeTab === 'SECTOR' ? 'grid-cols-[20px_60px_1fr_1fr_1fr_1.2fr_1.2fr_1.2fr]' :
                  activeTab === 'TIRE' ? 'grid-cols-[20px_60px_110px_1fr] gap-4' :
                  'grid-cols-[20px_60px_1.5fr_50px_1.5fr_60px_60px]'
                }`}
              >
                <span className="text-slate-500 font-bold text-xs">{i + 1}</span>
                <div className="flex items-center gap-2">
                  <div className="w-[3px] h-4 rounded" style={{ backgroundColor: d.teamColor || TEAM_COLORS[d.driver] || '#fff' }}></div>
                  <span className="text-slate-300 font-bold tracking-wider">{d.driver}</span>
                </div>
                
                {/* Dynamic Columns Rendered per Tab */}
                
                {/* TAB: LAP */}
                {activeTab === 'LAP' && (
                  <>
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
                              ${d.tire === 'SOFT' ? 'border-red-500 text-red-500 bg-red-950/20' : d.tire === 'MEDIUM' ? 'border-yellow-500 text-yellow-500 bg-yellow-950/20' : 'border-white text-white bg-slate-800/55'}`}>
                              {d.tire[0]}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-600 font-bold">-</div>
                        )}
                        <span className="text-[9px] text-slate-500 font-mono">{d.tireAge || 0}L</span>
                    </div>
                  </>
                )}

                {/* TAB: SECTOR */}
                {activeTab === 'SECTOR' && (
                  <>
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

                    <div className="flex flex-col items-center justify-center text-[11px] font-mono leading-tight font-bold">
                      <span className="text-yellow-400">{d.s1 || '-'}</span>
                      <span className="text-slate-500 text-[9px]">{d.bestS1 || '-'}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-[11px] font-mono leading-tight font-bold">
                      <span className="text-yellow-400">{d.s2 || '-'}</span>
                      <span className="text-slate-500 text-[9px]">{d.bestS2 || '-'}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-[11px] font-mono leading-tight font-bold">
                      <span className="text-yellow-400">{d.s3 || '-'}</span>
                      <span className="text-slate-500 text-[9px]">{d.bestS3 || '-'}</span>
                    </div>
                  </>
                )}

                {/* TAB: TIRE */}
                {activeTab === 'TIRE' && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border-2
                          ${d.tire === 'SOFT' ? 'border-red-500 text-red-500 bg-red-950/20' : d.tire === 'MEDIUM' ? 'border-yellow-500 text-yellow-500 bg-yellow-950/20' : 'border-white text-white bg-slate-800/50'}`}>
                          {d.tire ? d.tire[0] : 'S'}
                      </div>
                      <div className="flex flex-col text-[10px] leading-tight font-bold font-mono">
                          <span className="text-red-500">{d.pitstops || 0}PIT</span>
                          <span className="text-slate-300">{d.tireAge || 0}LAP</span>
                      </div>
                    </div>

                    <div className="flex items-center w-full px-2">
                      {(() => {
                        const age = d.tireAge || 0;
                        const limit = d.tire === 'SOFT' ? 20 : d.tire === 'MEDIUM' ? 30 : 45;
                        const pct = Math.min((age / limit) * 100, 100);
                        const barColor = d.tire === 'SOFT' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : d.tire === 'MEDIUM' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-slate-300 shadow-[0_0_8px_rgba(255,255,255,0.5)]';
                        return (
                          <div className="relative w-full h-4 bg-slate-900 rounded border border-slate-800 overflow-hidden flex items-center">
                            <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${pct}%` }}></div>
                            <span className="absolute right-2 font-mono text-[9px] font-black text-slate-400">
                              {age} / {limit} Laps
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}

                {/* TAB: CAR */}
                {activeTab === 'CAR' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200 min-w-[55px] text-right">{d.speed || 0}</span>
                      <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden hidden md:block">
                        <div className="h-full bg-cyan-400" style={{ width: `${Math.min(((d.speed || 0)/350)*100, 100)}%` }}></div>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-black text-center text-yellow-400">
                      {d.gear === 0 ? 'N' : d.gear || '-'}
                    </span>

                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${d.throttle || 0}%` }}></div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold min-w-[30px]">{d.throttle || 0}%</span>
                    </div>

                    <div className="text-center flex justify-center">
                      {d.brake ? (
                        <span className="bg-red-900/50 text-red-500 border border-red-800 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest">BRAKE</span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[9px] font-bold">-</span>
                      )}
                    </div>

                    <div className="text-center flex justify-center">
                      {d.drs >= 10 ? (
                        <span className="bg-green-950/50 text-green-400 border border-green-500 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest">DRS</span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[9px] font-bold">-</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
