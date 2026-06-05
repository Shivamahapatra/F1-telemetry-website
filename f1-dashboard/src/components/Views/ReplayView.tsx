"use client";
import React, { useState } from 'react';

const REPLAYS = [
  { id: 'monaco', title: 'Monaco Grand Prix Highlights', videoId: '0L-N7KzP8Ww', date: 'May 28, 2023' },
  { id: 'miami', title: 'Miami Grand Prix Highlights', videoId: 'U_i7_8k-13g', date: 'May 7, 2023' },
  { id: 'baku', title: 'Azerbaijan Grand Prix Highlights', videoId: 'BvE0gM0Y4O8', date: 'April 30, 2023' },
];

export default function ReplayView() {
  const [activeReplay, setActiveReplay] = useState(REPLAYS[0]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0D14] p-4 lg:p-8 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-4 lg:mb-8">
        <h2 className="text-2xl lg:text-3xl font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
          <span className="text-[var(--color-neon-red)]">▶</span> RACE REPLAYS
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 max-w-6xl mx-auto w-full">
        <div className="flex-1">
          <div className="w-full aspect-video bg-[#0F131D] rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${activeReplay.videoId}?autoplay=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <h3 className="text-xl lg:text-2xl font-bold text-white mt-4 lg:mt-6">{activeReplay.title}</h3>
          <p className="text-slate-500 font-bold tracking-widest text-xs lg:text-sm uppercase mt-1 lg:mt-2">{activeReplay.date}</p>
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Up Next</div>
          {REPLAYS.map(r => (
            <div 
              key={r.id} 
              onClick={() => setActiveReplay(r)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${activeReplay.id === r.id ? 'bg-slate-800 border-slate-600' : 'bg-[#0F131D] border-slate-800 hover:bg-slate-800/50'}`}
            >
              <div className="aspect-video bg-slate-900 rounded mb-3 overflow-hidden relative group">
                <img src={`https://img.youtube.com/vi/${r.videoId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl bg-black/50 rounded-full w-12 h-12 flex items-center justify-center text-white backdrop-blur pl-1">▶</span>
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-200">{r.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{r.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
