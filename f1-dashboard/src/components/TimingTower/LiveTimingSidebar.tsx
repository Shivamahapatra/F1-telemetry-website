"use client";
import React, { useState, useEffect } from 'react';
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
  TSU: "#6692FF", RIC: "#6692FF",
  ANT: "#27F4D2", // Antonelli (Mercedes)
  HAD: "#3671C6", // Hadjar (Red Bull)
  BOR: "#3671C6", // Bortoleto (Audi/Kick)
  BEA: "#E80020", // Bearman (Haas/Ferrari)
  LIN: "#3671C6", // Lindblad
  COL: "#005AFF", // Colapinto (Williams)
  LAW: "#6692FF"  // Lawson (VCARB)
};

export default function LiveTimingSidebar() {
  const { timingData } = useF1Telemetry();
  const [activeTab, setActiveTab] = useState<'LAP' | 'SECTOR' | 'TIRE' | 'CAR'>('LAP');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-[#0A0D14] items-center justify-center text-slate-500 py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mb-4"></div>
        <p className="font-bold tracking-widest text-xs uppercase">Loading Timing Tower...</p>
      </div>
    );
  }

  const isOffline = timingData.length === 0;

  // Calculate the maximum lap count for stint history Scaling
  const maxLaps = isOffline ? 30 : Math.max(
    ...timingData.map(d => {
      if (d.stints && d.stints.length > 0) {
        return d.stints[d.stints.length - 1].endLap;
      }
      return 30;
    }),
    30
  );

  return (
    <div className="flex flex-col h-full bg-[#0A0D14]">
      {/* Top Header Tabs */}
      <div className="flex bg-[#0F131D] border-b border-slate-800 p-2 gap-2 text-xs font-bold tracking-widest uppercase shrink-0">
        {(['LAP', 'SECTOR', 'TIRE', 'CAR'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 border rounded font-black transition-all duration-200 uppercase tracking-widest text-[10px] ${
              activeTab === tab
                ? 'bg-slate-800 border-slate-600 text-white shadow-md shadow-slate-900/50'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dynamic Grid Headers based on activeTab */}
      {activeTab === 'LAP' && (
        <div className="grid grid-cols-[20px_60px_1fr_1fr_1fr_2fr_40px] gap-2 px-4 py-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 tracking-widest uppercase min-w-[650px] shrink-0">
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
        <div className="grid grid-cols-[20px_60px_1fr_1fr_1fr_1.2fr_1.2fr_1.2fr] gap-2 px-4 py-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 tracking-widest uppercase min-w-[650px] shrink-0">
          <div></div>
          <div>DRIVER</div>
          <div className="text-right">BEST</div>
          <div className="text-right">INTERVAL</div>
          <div className="text-center">LAST</div>
          <div className="text-center">S1 / REF</div>
          <div className="text-center">S2 / REF</div>
          <div className="text-center">S3 / REF</div>
        </div>
      )}

      {activeTab === 'TIRE' && (
        <div className="grid grid-cols-[20px_60px_1.5fr_5fr] gap-4 px-4 py-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 tracking-widest uppercase min-w-[650px] shrink-0">
          <div></div>
          <div>DRIVER</div>
          <div className="text-center">STINT / compound</div>
          <div className="text-center">STINT TIMELINE HISTORY (LAPS)</div>
        </div>
      )}

      {activeTab === 'CAR' && (
        <div className="grid grid-cols-[20px_60px_1.5fr_1fr_2fr_1fr] gap-2 px-4 py-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 tracking-widest uppercase min-w-[650px] shrink-0">
          <div></div>
          <div>DRIVER</div>
          <div className="text-right">SPEED</div>
          <div className="text-center">GEAR</div>
          <div className="text-center">THROTTLE / BRAKE</div>
          <div className="text-center">DRS</div>
        </div>
      )}

      {/* Driver List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 min-w-[650px]">
        {isOffline ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mb-4"></div>
            <p className="font-bold tracking-widest text-xs uppercase">Connecting to F1 Live Timing...</p>
            <p className="text-[10px] mt-2 max-w-xs text-center">If the session is active, the leaderboard will populate as cars set new sector times.</p>
          </div>
        ) : (
          timingData.map((d, i) => {
            const teamColor = TEAM_COLORS[d.driver] || '#fff';
            
            return (
              <div key={d.driver} className="hover:bg-slate-800/30 rounded group transition-all duration-150">
                {/* 1. LAP VIEW ROW */}
                {activeTab === 'LAP' && (
                  <div className="grid grid-cols-[20px_60px_1fr_1fr_1fr_2fr_40px] items-center gap-2 py-1 px-2">
                    <span className="text-slate-500 font-bold text-xs">{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-[3px] h-4 rounded" style={{ backgroundColor: teamColor }}></div>
                      <span className="text-slate-300 font-bold tracking-wider">{d.driver}</span>
                    </div>
                    <span className="text-[var(--color-neon-green)] text-green-400 font-mono text-xs text-right font-bold">
                      {d.bestLap || '-'}
                    </span>
                    
                    <div className="flex flex-col items-end leading-tight">
                      <span className="text-white font-mono text-xs font-bold">{d.gapToLeader || '-'}</span>
                      {i > 0 && d.interval && <span className="text-[10px] text-blue-400 font-mono">{d.interval}</span>}
                    </div>

                    <div className="text-center">
                      {d.pitStatus ? (
                        <span className="bg-red-950 text-red-400 border border-red-800/50 px-2 py-0.5 rounded text-[10px] font-black tracking-widest">
                          {d.pitStatus}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs text-center font-bold">{d.lastLap || '-'}</span>
                      )}
                    </div>

                    <div className="flex flex-col items-center justify-center gap-1">
                      {!d.pitStatus && d.s1 && d.s2 && d.s3 ? (
                        <div className="flex justify-between w-full px-2 text-[9px] font-mono font-bold">
                          <span className={d.s1State === 'purple' ? 'text-purple-400 font-extrabold' : d.s1State === 'green' ? 'text-green-400' : 'text-yellow-500'}>{d.s1}</span>
                          <span className={d.s2State === 'purple' ? 'text-purple-400 font-extrabold' : d.s2State === 'green' ? 'text-green-400' : 'text-yellow-500'}>{d.s2}</span>
                          <span className={d.s3State === 'purple' ? 'text-purple-400 font-extrabold' : d.s3State === 'green' ? 'text-green-400' : 'text-yellow-500'}>{d.s3}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-600 font-bold">-</div>
                      )}
                    </div>

                    <div className="flex flex-col items-center justify-center gap-0.5">
                      {d.tire ? (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                          d.tire === 'SOFT' ? 'border-red-500 text-red-500 bg-red-950/20' : 
                          d.tire === 'MEDIUM' ? 'border-yellow-500 text-yellow-500 bg-yellow-950/20' : 
                          'border-slate-300 text-slate-300 bg-slate-900'
                        }`}>
                          {d.tire[0]}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-600 font-bold">-</div>
                      )}
                      <span className="text-[9px] text-slate-500 font-mono">{d.tireAge ? `${d.tireAge}L` : '-'}</span>
                    </div>
                  </div>
                )}

                {/* 2. SECTOR VIEW ROW */}
                {activeTab === 'SECTOR' && (
                  <div className="grid grid-cols-[20px_60px_1fr_1fr_1fr_1.2fr_1.2fr_1.2fr] items-center gap-2 py-1.5 px-2">
                    <span className="text-slate-500 font-bold text-xs">{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-[3px] h-4 rounded" style={{ backgroundColor: teamColor }}></div>
                      <span className="text-slate-300 font-bold tracking-wider">{d.driver}</span>
                    </div>
                    <span className="text-green-400 font-mono text-xs text-right font-bold">{d.bestLap || '-'}</span>
                    
                    <div className="flex flex-col items-end leading-tight">
                      <span className="text-white font-mono text-xs font-bold">{d.gapToLeader || '-'}</span>
                      {i > 0 && d.interval && <span className="text-[10px] text-blue-400 font-mono">{d.interval}</span>}
                    </div>

                    <div className="text-center">
                      {d.pitStatus ? (
                        <span className="bg-red-950 text-red-400 border border-red-800/50 px-2 py-0.5 rounded text-[10px] font-black tracking-widest">
                          {d.pitStatus}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs text-center font-bold">{d.lastLap || '-'}</span>
                      )}
                    </div>

                    {/* S1 */}
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span className={`font-mono text-xs font-bold ${
                        d.s1State === 'purple' ? 'text-purple-400 font-black' : d.s1State === 'green' ? 'text-green-400' : d.s1State === 'yellow' ? 'text-yellow-500' : 'text-slate-500'
                      }`}>{d.s1 || '-'}</span>
                      <span className="text-[9px] text-slate-600 font-mono mt-0.5">/ {d.bestS1 || '-'}</span>
                    </div>

                    {/* S2 */}
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span className={`font-mono text-xs font-bold ${
                        d.s2State === 'purple' ? 'text-purple-400 font-black' : d.s2State === 'green' ? 'text-green-400' : d.s2State === 'yellow' ? 'text-yellow-500' : 'text-slate-500'
                      }`}>{d.s2 || '-'}</span>
                      <span className="text-[9px] text-slate-600 font-mono mt-0.5">/ {d.bestS2 || '-'}</span>
                    </div>

                    {/* S3 */}
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span className={`font-mono text-xs font-bold ${
                        d.s3State === 'purple' ? 'text-purple-400 font-black' : d.s3State === 'green' ? 'text-green-400' : d.s3State === 'yellow' ? 'text-yellow-500' : 'text-slate-500'
                      }`}>{d.s3 || '-'}</span>
                      <span className="text-[9px] text-slate-600 font-mono mt-0.5">/ {d.bestS3 || '-'}</span>
                    </div>
                  </div>
                )}

                {/* 3. TIRE VIEW ROW */}
                {activeTab === 'TIRE' && (
                  <div className="grid grid-cols-[20px_60px_1.5fr_5fr] items-center gap-4 py-2.5 px-2">
                    <span className="text-slate-500 font-bold text-xs">{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-[3px] h-4 rounded" style={{ backgroundColor: teamColor }}></div>
                      <span className="text-slate-300 font-bold tracking-wider">{d.driver}</span>
                    </div>

                    {/* Current Tyre / Pit Status */}
                    <div className="flex items-center justify-center gap-3">
                      {d.tire ? (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 shrink-0 ${
                          d.tire === 'SOFT' ? 'border-red-500 text-red-500 bg-red-950/20' : 
                          d.tire === 'MEDIUM' ? 'border-yellow-500 text-yellow-500 bg-yellow-950/20' : 
                          'border-slate-300 text-slate-300 bg-slate-900'
                        }`}>
                          {d.tire[0]}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 font-bold shrink-0">-</div>
                      )}
                      
                      <div className="flex flex-col items-start leading-none gap-0.5 font-bold shrink-0">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">
                          {d.stints ? `${d.stints.length - 1} PIT` : '-'}
                        </span>
                        <span className="text-[10px] text-white font-mono">
                          {d.tireAge ? `${d.tireAge} LAP` : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Stint Timeline Progress Bar */}
                    <div className="relative w-full h-4 bg-slate-900 rounded-full border border-slate-800 overflow-visible flex items-center pr-6">
                      {/* Grid / Ticks */}
                      <div className="absolute inset-0 pointer-events-none text-[8px] font-mono text-slate-500">
                        {/* Start index */}
                        <span className="absolute left-0 -top-4 transform -translate-x-1/2">0</span>
                        {/* Stints ends */}
                        {d.stints?.map((stint: any, sIdx: number) => {
                          const percent = (stint.endLap / maxLaps) * 100;
                          return (
                            <React.Fragment key={sIdx}>
                              {/* vertical line boundary partition */}
                              <div 
                                className="absolute top-0 bottom-0 w-[1.5px] bg-slate-950 z-10" 
                                style={{ left: `${percent}%` }}
                              />
                              {/* lap number label */}
                              <span 
                                className="absolute -top-4 transform -translate-x-1/2 font-bold" 
                                style={{ left: `${percent}%` }}
                              >
                                {stint.endLap}
                              </span>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Stint colored segment fills */}
                      {d.stints?.map((stint: any, sIdx: number) => {
                        const startPercent = ((stint.startLap - 1) / maxLaps) * 100;
                        const endPercent = (stint.endLap / maxLaps) * 100;
                        const width = endPercent - startPercent;
                        
                        const colorClass = 
                          stint.compound === 'SOFT' ? 'bg-red-500 hover:bg-red-400 border-red-600' :
                          stint.compound === 'MEDIUM' ? 'bg-yellow-500 hover:bg-yellow-400 border-yellow-600' :
                          stint.compound === 'HARD' ? 'bg-slate-300 hover:bg-white border-slate-400' :
                          stint.compound === 'INTERMEDIATE' ? 'bg-green-500 hover:bg-green-400 border-green-600' :
                          stint.compound === 'WET' ? 'bg-blue-500 hover:bg-blue-400 border-blue-600' :
                          'bg-slate-600 hover:bg-slate-500 border-slate-700';

                        return (
                          <div
                            key={sIdx}
                            className={`absolute h-2.5 rounded-sm border-r transition-all duration-150 ${colorClass}`}
                            style={{ 
                              left: `${startPercent}%`, 
                              width: `${width}%` 
                            }}
                            title={`Stint ${stint.number}: ${stint.compound} (Laps ${stint.startLap}-${stint.endLap})`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. CAR TELEMETRY VIEW ROW */}
                {activeTab === 'CAR' && (
                  <div className="grid grid-cols-[20px_60px_1.5fr_1fr_2fr_1fr] items-center gap-2 py-2 px-2">
                    <span className="text-slate-500 font-bold text-xs">{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-[3px] h-4 rounded" style={{ backgroundColor: teamColor }}></div>
                      <span className="text-slate-300 font-bold tracking-wider">{d.driver}</span>
                    </div>

                    {/* Speed Numeric + Mini progress bar */}
                    <div className="flex flex-col items-end pr-2 leading-none">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xs font-black font-mono text-white">{d.speed !== undefined ? d.speed : '-'}</span>
                        <span className="text-[8px] text-slate-500 font-bold">km/h</span>
                      </div>
                      <div className="w-full max-w-[80px] h-1 bg-slate-900 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-200" 
                          style={{ width: `${d.speed !== undefined ? Math.min(100, (d.speed / 340) * 100) : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Gear circle */}
                    <div className="flex justify-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs border transition-colors duration-200 ${
                        d.gear === 0 || d.gear === 'N'
                          ? 'bg-red-950/40 border-red-500 text-red-500 animate-pulse'
                          : 'bg-slate-900 border-cyan-500/50 text-cyan-400'
                      }`}>
                        {d.gear === 0 || d.gear === 'N' ? 'N' : d.gear}
                      </div>
                    </div>

                    {/* Throttle / Brake meters */}
                    <div className="flex flex-col gap-1 w-full px-2">
                      <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500">
                        <span className="w-4">THR</span>
                        <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-150" 
                            style={{ width: `${d.throttle !== undefined ? d.throttle : 0}%` }}
                          />
                        </div>
                        <span className="w-7 text-right font-mono text-[8px]">{d.throttle !== undefined ? `${d.throttle}%` : '0%'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500">
                        <span className="w-4">BRK</span>
                        <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-600 rounded-full transition-all duration-150" 
                            style={{ width: `${d.brake ? 100 : 0}%` }}
                          />
                        </div>
                        <span className="w-7 text-right font-mono text-[8px]">{d.brake ? '100%' : '0%'}</span>
                      </div>
                    </div>

                    {/* DRS pill badge */}
                    <div className="flex justify-center">
                      {d.drs ? (
                        <span className="bg-green-500/20 text-green-400 border border-green-500/50 px-2 py-0.5 rounded text-[8px] font-black tracking-widest text-center shadow-sm shadow-green-500/10 uppercase">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="border border-slate-800 text-slate-600 px-2 py-0.5 rounded text-[8px] font-bold tracking-widest text-center uppercase">
                          OFF
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
