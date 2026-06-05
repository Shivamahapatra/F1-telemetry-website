"use client";
import React from 'react';
import { useF1Telemetry } from "@/hooks/useF1Telemetry";

export default function RaceControlsView() {
  const { raceControlMsgs, teamRadioMsgs } = useF1Telemetry();

  return (
    <div className="flex flex-col h-full bg-[#0F131D]">
      <div className="flex justify-between items-center p-4 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white tracking-widest uppercase">Race Controls</h3>
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Show BlueFlag</span>
            <div className="w-8 h-4 bg-slate-700 rounded-full relative cursor-pointer">
                <div className="w-3 h-3 bg-white rounded-full absolute left-[2px] top-[2px]"></div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
        {raceControlMsgs.length === 0 && (
            <div className="flex items-center justify-center h-full text-slate-500 opacity-50">
                <span className="text-xs font-bold tracking-widest uppercase">NO RACE CONTROL MESSAGES</span>
            </div>
        )}
        {raceControlMsgs.map((msg, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                {msg.type === 'incident' && <span className="text-orange-500">⚠️</span>}
                {msg.type === 'yellow' && <span className="text-yellow-500">🟨</span>}
                {msg.type === 'green' && <span className="text-green-500">🟩</span>}
                {msg.type === 'info' && <span className="text-blue-500">ℹ️</span>}
                
                <span className="text-[10px] text-slate-500 font-mono">{msg.time}</span>
            </div>
            <div className={`p-3 text-xs font-bold font-sans uppercase rounded border-l-4 ${
                msg.type === 'incident' ? 'bg-slate-800/50 border-orange-500 text-slate-200' :
                msg.type === 'yellow' ? 'bg-yellow-600/20 border-yellow-500 text-yellow-500' :
                msg.type === 'green' ? 'bg-green-600/20 border-green-500 text-green-500' :
                'bg-blue-600/20 border-blue-500 text-blue-400'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="h-1/3 border-t border-slate-800 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-800/50">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase">Team Radio</h3>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Show Transcript</span>
                <div className="w-8 h-4 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="w-3 h-3 bg-white rounded-full absolute right-[2px] top-[2px]"></div>
                </div>
            </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-2">
            {teamRadioMsgs.length === 0 ? (
                <div className="flex h-full items-center justify-center opacity-50">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="animate-pulse text-red-500">●</span> NO INCOMING TRANSMISSIONS
                    </div>
                </div>
            ) : (
                teamRadioMsgs.map((msg, idx) => (
                    <div key={idx} className="flex flex-col gap-1 p-2 rounded bg-slate-800/30 border border-slate-700/50">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold" style={{ color: msg.color || '#fff' }}>{msg.driver}</span>
                            <span className="text-[9px] text-slate-500 font-mono">{msg.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-mono">{msg.text}</p>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
