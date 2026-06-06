"use client";
import React from 'react';
import { useF1Telemetry } from "@/hooks/useF1Telemetry";

export default function RaceControlsView() {
  const { raceControlMessages, teamRadioMessages } = useF1Telemetry();

  // If offline/empty, show initial standard messages
  const activeMessages = raceControlMessages.length > 0 ? raceControlMessages : [
    { time: '14:30:01', type: 'incident', text: 'FIA STEWARDS: INCIDENT INVOLVING CAR 30 (LAW) WILL BE INVESTIGATED AFTER THE SESSION - LEAVING PIT EXIT ON RED LIGHT' },
    { time: '14:28:11', type: 'yellow', text: 'DOUBLE YELLOW IN TRACK SECTOR 16' },
    { time: '14:28:45', type: 'green', text: 'CLEAR IN TRACK SECTOR 16' },
    { time: '14:15:20', type: 'green', text: 'CLEAR IN TRACK SECTOR 13' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0F131D]">
      <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
        <h3 className="text-sm font-bold text-white tracking-widest uppercase">Race Controls</h3>
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Show BlueFlag</span>
            <div className="w-8 h-4 bg-slate-700 rounded-full relative cursor-pointer">
                <div className="w-3 h-3 bg-white rounded-full absolute left-[2px] top-[2px]"></div>
            </div>
        </div>
      </div>

      {/* Race Control Messages List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
        {activeMessages.map((msg, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                {msg.type === 'incident' && <span className="text-orange-500">⚠️</span>}
                {(msg.type === 'yellow' || msg.type === 'double_yellow') && <span className="text-yellow-500">🟨</span>}
                {msg.type === 'green' && <span className="text-green-500">🟩</span>}
                
                <span className="text-[10px] text-slate-500 font-mono font-bold">{msg.time}</span>
            </div>
            <div className={`p-3 text-xs font-bold font-sans uppercase rounded border-l-4 ${
                msg.type === 'incident' ? 'bg-slate-800/50 border-orange-500 text-slate-200' :
                (msg.type === 'yellow' || msg.type === 'double_yellow') ? 'bg-yellow-600/20 border-yellow-500 text-yellow-500' :
                'bg-green-600/20 border-green-500 text-green-500'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Team Radio Section */}
      <div className="h-[40%] border-t border-slate-800 flex flex-col min-h-[220px]">
        <div className="flex justify-between items-center p-4 border-b border-slate-800/50 shrink-0">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase">Team Radio</h3>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Show Transcript</span>
                <div className="w-8 h-4 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="w-3 h-3 bg-white rounded-full absolute right-[2px] top-[2px]"></div>
                </div>
            </div>
        </div>
        
        {/* Live Radio Transcripts */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3 bg-slate-900/10">
          {teamRadioMessages.length > 0 ? (
            teamRadioMessages.map((radio, idx) => (
              <div key={idx} className="flex flex-col gap-1 border-b border-slate-800/30 pb-2">
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span className="font-bold text-cyan-400 uppercase">📻 {radio.driver} Channel</span>
                  <span>{radio.time}</span>
                </div>
                <p className="text-xs text-slate-300 font-semibold italic">"{radio.text}"</p>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center opacity-50 h-full">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span className="animate-pulse text-red-500">●</span> NO INCOMING TRANSMISSIONS
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
