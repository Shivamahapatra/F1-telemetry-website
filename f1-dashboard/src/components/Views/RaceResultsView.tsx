"use client";
import React, { useState, useEffect } from 'react';

const getResultColor = (res: string) => {
  if (res === '1') return 'bg-blue-600 text-white font-black';
  if (res === '2') return 'bg-blue-700 text-white font-bold';
  if (res === '3') return 'bg-blue-800 text-white font-bold';
  if (res === 'R' || res === 'D' || res === 'W' || res === 'DNF') return 'bg-red-900/50 text-red-400 font-bold';
  if (res === '-') return 'bg-transparent text-slate-700';
  return 'bg-blue-900/30 text-blue-300';
};

export default function RaceResultsView() {
  const [resultsMatrix, setResultsMatrix] = useState<any[]>([]);
  const [totalRounds, setTotalRounds] = useState(24);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.jolpi.ca/ergast/f1/current/results.json?limit=1000')
      .then(res => res.json())
      .then(data => {
        const races = data.MRData.RaceTable.Races;
        if (!races || races.length === 0) {
            setLoading(false);
            return;
        }
        
        // Find maximum round
        const maxRound = Math.max(...races.map((r: any) => parseInt(r.round)));
        setTotalRounds(Math.max(24, maxRound));

        const driverMap: Record<string, any> = {};

        races.forEach((race: any) => {
          const roundIdx = parseInt(race.round) - 1;
          
          race.Results.forEach((res: any) => {
            const driverCode = res.Driver.code || res.Driver.familyName.substring(0,3).toUpperCase();
            if (!driverMap[driverCode]) {
              driverMap[driverCode] = {
                driver: driverCode,
                points: 0,
                results: Array(24).fill('-')
              };
            }
            
            driverMap[driverCode].points += parseFloat(res.points);
            
            // Map finish position
            let posText = res.positionText;
            if (posText === 'R' || posText === 'D' || posText === 'W') {
                posText = 'DNF';
            }
            driverMap[driverCode].results[roundIdx] = posText;
          });
        });

        const sortedDrivers = Object.values(driverMap).sort((a: any, b: any) => b.points - a.points);
        sortedDrivers.forEach((d: any, idx: number) => { d.pos = idx + 1; });
        
        setResultsMatrix(sortedDrivers);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch results", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center text-slate-500 animate-pulse">Loading Real Race Results...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0D14] p-4 lg:p-8 overflow-x-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Race Results Heatmap</h2>
        <div className="text-right">
            <div className="text-xs text-[var(--color-neon-red)] font-bold uppercase tracking-widest animate-pulse">Live API Connected</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Jolpi Ergast F1</div>
        </div>
      </div>
      
      <div className="min-w-[1200px]">
        {/* Header Row */}
        <div className="grid gap-1 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center" 
             style={{ gridTemplateColumns: `150px repeat(${totalRounds}, 1fr)` }}>
          <div className="text-left pl-4">Driver</div>
          {Array.from({length: totalRounds}).map((_, i) => (
            <div key={i}>{i + 1}R</div>
          ))}
        </div>

        {/* Results Matrix */}
        <div className="flex flex-col gap-1">
          {resultsMatrix.map((row, i) => (
            <div key={i} className="grid gap-1 h-10 group" style={{ gridTemplateColumns: `150px repeat(${totalRounds}, 1fr)` }}>
              {/* Driver Info */}
              <div className="flex items-center gap-4 pl-2 bg-[#0F131D] rounded-l group-hover:bg-slate-800 transition-colors">
                <span className="w-4 text-center text-xs font-bold text-slate-500">{row.pos}</span>
                <span className="text-sm font-black tracking-wider text-slate-200">{row.driver}</span>
                <span className="text-[10px] font-bold text-slate-500 ml-auto mr-2">{row.points}pt</span>
              </div>

              {/* Grid Cells */}
              {row.results.slice(0, totalRounds).map((res: any, j: number) => (
                <div key={j} className={`flex items-center justify-center rounded text-xs ${getResultColor(res)} group-hover:opacity-80 transition-opacity`}>
                  {res}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
