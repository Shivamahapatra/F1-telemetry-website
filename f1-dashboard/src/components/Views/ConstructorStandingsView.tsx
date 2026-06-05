"use client";
import React, { useState, useEffect } from 'react';

const getTeamColor = (teamName: string) => {
  const name = teamName.toLowerCase();
  if (name.includes('red bull')) return 'border-l-[#3671C6]';
  if (name.includes('mercedes')) return 'border-l-[#6CD3BF]';
  if (name.includes('ferrari')) return 'border-l-[#E80020]';
  if (name.includes('mclaren')) return 'border-l-[#FF8000]';
  if (name.includes('aston')) return 'border-l-[#229971]';
  if (name.includes('alpine')) return 'border-l-[#FF87BC]';
  if (name.includes('williams')) return 'border-l-[#37BEDD]';
  if (name.includes('rb')) return 'border-l-[#6692FF]';
  if (name.includes('haas')) return 'border-l-[#B6BABD]';
  if (name.includes('audi')) return 'border-l-[#F20000]';
  if (name.includes('cadillac')) return 'border-l-[#F3C12C]';
  return 'border-l-slate-600';
};

export default function ConstructorStandingsView() {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.jolpi.ca/ergast/f1/current/constructorStandings.json')
      .then(res => res.json())
      .then(data => {
        const lists = data.MRData.StandingsTable.StandingsLists;
        if (lists && lists.length > 0) {
          setStandings(lists[0].ConstructorStandings);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch constructor standings", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center text-slate-500 animate-pulse">Loading Live Constructors Standings...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0D14] p-8 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Constructors Standings</h2>
        <div className="text-right">
            <div className="text-xs text-[var(--color-neon-red)] font-bold uppercase tracking-widest animate-pulse">Live API Connected</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Jolpi Ergast F1</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-w-4xl mx-auto w-full pb-16">
        <div className="grid grid-cols-[80px_1fr_100px_100px] gap-4 px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
          <div className="text-center">Pos</div>
          <div>Constructor</div>
          <div className="text-center">Wins</div>
          <div className="text-right">Points</div>
        </div>

        {standings.map((s, i) => (
          <div key={i} className={`grid grid-cols-[80px_1fr_100px_100px] gap-4 items-center px-6 py-4 bg-[#0F131D] rounded-xl border-l-4 ${getTeamColor(s.Constructor.name)} hover:bg-slate-800/50 transition-colors shadow-lg`}>
            <div className="text-3xl font-black text-slate-400 text-center">{s.position}</div>
            <div>
              <div className="text-xl font-black text-white uppercase tracking-wider">{s.Constructor.name}</div>
              <div className="text-xs font-bold text-slate-500 mt-1">{s.Constructor.nationality}</div>
            </div>
            <div className="text-center font-mono text-slate-300">{s.wins}</div>
            <div className="text-right text-3xl font-black text-[var(--color-neon-red)]">{s.points}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
