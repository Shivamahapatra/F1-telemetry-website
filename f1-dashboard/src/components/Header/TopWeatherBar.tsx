"use client";
import React from 'react';
import { useF1Telemetry } from "@/hooks/useF1Telemetry";

export default function TopWeatherBar() {
  const { sessionInfo, weatherData } = useF1Telemetry();

  // Safe fallbacks for initial load
  const sessionName = sessionInfo?.name || "CONNECTING TO LIVE SESSION...";
  const sessionStatus = sessionInfo?.status || "Offline";
  const currentLap = sessionInfo?.lap || 0;
  const totalLaps = sessionInfo?.totalLaps || 0;

  const w = weatherData || {};

  return (
    <div className="flex flex-col w-full h-full p-4 gap-4">
      {/* Top Row: Title & Status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl">🇨🇦</span>
          <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-slate-200">
            {sessionName}
          </h2>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Track Status</span>
            <span className={`px-3 py-1 rounded font-black text-xs tracking-wider uppercase ${
              sessionStatus === 'Green' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
              sessionStatus === 'Red' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 
              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
            }`}>
              {sessionStatus}
            </span>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded border border-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-slate-300 font-mono tracking-widest">FEED ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Weather Cards & Lap Counter */}
      <div className="flex gap-4 items-center">
        <WeatherCard icon="🌡️" label="Air Temp" value={w.airTemp ? `${w.airTemp.toFixed(1)}°C` : '--'} />
        <WeatherCard icon="🛣️" label="Track Temp" value={w.trackTemp ? `${w.trackTemp.toFixed(1)}°C` : '--'} />
        <WeatherCard icon="💧" label="Humidity" value={w.humidity ? `${w.humidity}%` : '--'} />
        <WeatherCard icon="💨" label="Wind" value={w.windSpeed ? `${w.windSpeed} km/h` : '--'} />
        <WeatherCard icon="🌧️" label="Rain" value={w.rainfall ? 'Yes' : 'No'} />
        
        <div className="ml-auto flex items-center gap-4 px-6 py-2 bg-slate-900 rounded-xl border border-slate-800 shadow-inner">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">LAP</span>
          <span className="text-3xl font-black font-mono text-white">
            {currentLap} <span className="text-slate-600 text-xl">/ {totalLaps}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function WeatherCard({ icon, label, value }: { icon: string, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 bg-slate-800/30 px-4 py-2 rounded-lg border border-slate-700/50 min-w-[140px]">
      <span className="text-xl">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</span>
        <span className="text-sm font-mono font-bold text-slate-200">{value}</span>
      </div>
    </div>
  );
}
