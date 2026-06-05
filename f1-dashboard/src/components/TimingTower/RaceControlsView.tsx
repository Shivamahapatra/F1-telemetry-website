"use client";
import React from 'react';

const MESSAGES = [
  { time: '14:30:01', type: 'incident', text: 'FIA STEWARDS: INCIDENT INVOLVING CAR 30 (LAW) WILL BE INVESTIGATED AFTER THE SESSION - LEAVING PIT EXIT ON RED LIGHT' },
  { time: '14:28:11', type: 'yellow', text: 'DOUBLE YELLOW IN TRACK SECTOR 16' },
  { time: '14:28:45', type: 'green', text: 'CLEAR IN TRACK SECTOR 16' },
  { time: '14:15:20', type: 'green', text: 'CLEAR IN TRACK SECTOR 13' }
];

export default function RaceControlsView() {
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
        {MESSAGES.map((msg, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                {msg.type === 'incident' && <span className="text-orange-500">⚠️</span>}
                {msg.type === 'yellow' && <span className="text-yellow-500">🟨</span>}
                {msg.type === 'green' && <span className="text-green-500">🟩</span>}
                
                <span className="text-[10px] text-slate-500 font-mono">{msg.time}</span>
            </div>
            <div className={`p-3 text-xs font-bold font-sans uppercase rounded border-l-4 ${
                msg.type === 'incident' ? 'bg-slate-800/50 border-orange-500 text-slate-200' :
                msg.type === 'yellow' ? 'bg-yellow-600/20 border-yellow-500 text-yellow-500' :
                'bg-green-600/20 border-green-500 text-green-500'
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
        <div className="flex-1 p-4 flex items-center justify-center opacity-50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="animate-pulse text-red-500">●</span> NO INCOMING TRANSMISSIONS
            </div>
        </div>
      </div>
    </div>
  );
}
