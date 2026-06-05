"use client";
import React, { useState, useEffect } from 'react';

const getFlagEmoji = (country: string) => {
  const flags: Record<string, string> = {
    'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'Australia': '🇦🇺', 'Japan': '🇯🇵',
    'China': '🇨🇳', 'USA': '🇺🇸', 'United States': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨',
    'Canada': '🇨🇦', 'Spain': '🇪🇸', 'Austria': '🇦🇹', 'UK': '🇬🇧', 'Hungary': '🇭🇺',
    'Belgium': '🇧🇪', 'Netherlands': '🇳🇱', 'Azerbaijan': '🇦🇿', 'Singapore': '🇸🇬',
    'Mexico': '🇲🇽', 'Brazil': '🇧🇷', 'Qatar': '🇶🇦', 'UAE': '🇦🇪'
  };
  return flags[country] || '🏁';
};

const formatTime = (dateStr: string, timeStr?: string) => {
  if (!timeStr) return 'TBC';
  const d = new Date(`${dateStr}T${timeStr}`);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const getStatus = (dateStr: string) => {
  const raceDate = new Date(dateStr);
  const now = new Date();
  return raceDate < now ? 'Completed' : 'Upcoming';
};

export default function CalendarView() {
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.jolpi.ca/ergast/f1/current.json')
      .then(res => res.json())
      .then(data => {
        const racesData = data.MRData.RaceTable.Races;
        setRaces(racesData);
        setSelectedRace(racesData[0]);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch calendar", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center text-slate-500 animate-pulse">Loading Real Calendar Data...</div>;
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row h-full w-full overflow-y-auto lg:overflow-hidden">
      {/* Left Panel: Race List */}
      <div className="w-full lg:w-[35%] shrink-0 h-auto lg:h-full lg:border-r border-slate-800 flex flex-col bg-[#0A0D14]">
        <div className="p-4 border-b border-t lg:border-t-0 border-slate-800 flex justify-between items-center bg-[#0F131D]">
          <h2 className="text-xl font-bold">GP Calendar</h2>
          <div className="text-right">
            <div className="text-xs text-[var(--color-neon-red)] font-bold uppercase tracking-widest animate-pulse">Live API Connected</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Jolpi Ergast F1</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-visible lg:overflow-y-auto custom-scrollbar">
          {races.map((r, i) => {
            const status = getStatus(r.date);
            return (
              <div 
                key={i} 
                onClick={() => setSelectedRace(r)}
                className={`flex items-center p-4 border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer ${
                  selectedRace?.round === r.round ? 'bg-slate-800/50 border-l-4 border-l-blue-500' : ''
                } ${status === 'Upcoming' ? 'bg-slate-800/10' : ''}`}
              >
                <div className="w-12 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-300">{r.round}</span>
                  <span className="text-[10px] text-slate-500 uppercase">Round</span>
                </div>
                
                <div className="flex-1 ml-2">
                  <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
                    <span>{getFlagEmoji(r.Circuit.Location.country)}</span>
                    {r.Circuit.Location.locality} / {r.Circuit.Location.country}
                  </div>
                  <div className="font-bold text-sm text-slate-200 mt-0.5">{r.season} {r.raceName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{r.Circuit.circuitName}</div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    status === 'Completed' ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50' : 'bg-[var(--color-neon-red)]/20 text-[var(--color-neon-red)] border border-[var(--color-neon-red)]/50'
                  }`}>
                    {status}
                  </span>
                  <div className="text-[10px] text-slate-500">{formatTime(r.date, r.time).split(',')[0]}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Grand Prix Details */}
      {selectedRace && (
        <div className="w-full lg:w-[65%] h-auto lg:h-full flex flex-col bg-[#0F131D] overflow-y-visible lg:overflow-y-auto custom-scrollbar p-4 lg:p-8 gap-4 lg:gap-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-wider text-white leading-tight">{selectedRace.season} {selectedRace.raceName}</h1>
            <div className="flex flex-col lg:flex-row justify-between lg:items-center mt-2 text-slate-400 text-xs lg:text-sm font-bold gap-2">
              <span className="text-blue-400">{formatTime(selectedRace.date, selectedRace.time)}</span>
              <span>{selectedRace.Circuit.Location.locality} / {selectedRace.Circuit.Location.country} / {selectedRace.Circuit.circuitName}</span>
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-[45%_55%] gap-8">
            {/* Session Schedules */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Session Schedules</h3>
              <div className="flex flex-col gap-2">
                {selectedRace.FirstPractice && <SessionRow name="Practice 1" date={formatTime(selectedRace.FirstPractice.date, selectedRace.FirstPractice.time)} />}
                {selectedRace.SecondPractice && <SessionRow name="Practice 2" date={formatTime(selectedRace.SecondPractice.date, selectedRace.SecondPractice.time)} />}
                {selectedRace.ThirdPractice && <SessionRow name="Practice 3" date={formatTime(selectedRace.ThirdPractice.date, selectedRace.ThirdPractice.time)} />}
                {selectedRace.Sprint && <SessionRow name="Sprint" date={formatTime(selectedRace.Sprint.date, selectedRace.Sprint.time)} />}
                {selectedRace.Qualifying && <SessionRow name="Qualifying" date={formatTime(selectedRace.Qualifying.date, selectedRace.Qualifying.time)} />}
                <SessionRow name="Race" date={formatTime(selectedRace.date, selectedRace.time)} />
              </div>
            </div>

            {/* Track Information */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Track Information</h3>
              <div className="flex flex-col gap-4">
                <TrackStat label="Circuit ID" value={selectedRace.Circuit.circuitId} />
                <TrackStat label="Latitude" value={selectedRace.Circuit.Location.lat} />
                <TrackStat label="Longitude" value={selectedRace.Circuit.Location.long} />
              </div>

              <div className="mt-8 bg-[#0A0D14] rounded-xl border border-slate-800 p-4 aspect-video flex items-center justify-center">
                <div className="text-slate-600 text-xs lg:text-sm font-bold tracking-widest uppercase flex flex-col items-center gap-2 text-center">
                  <span className="text-3xl">🗺️</span>
                  Circuit Map Data Coming Soon
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionRow({ name, date }: { name: string, date: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
      <span className="px-3 py-1 rounded bg-slate-800 text-blue-400 text-xs font-bold uppercase tracking-wider">{name}</span>
      <span className="text-sm text-slate-300 font-mono">{date}</span>
    </div>
  );
}

function TrackStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-800/30">
      <span className="text-sm text-slate-500 font-bold">{label}</span>
      <span className="text-lg font-black text-slate-200">{value}</span>
    </div>
  );
}
