"use client";
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const TEAM_COLORS = {
  'VER': '#3671C6', 'PER': '#3671C6',
  'HAM': '#6CD3BF', 'RUS': '#6CD3BF',
  'LEC': '#E80020', 'SAI': '#E80020',
  'NOR': '#FF8000', 'PIA': '#FF8000',
  'ALO': '#229971', 'STR': '#229971',
  'OCO': '#FF87BC', 'GAS': '#FF87BC',
  'ALB': '#37BEDD', 'SAR': '#37BEDD',
  'TSU': '#6692FF', 'RIC': '#6692FF',
  'BOT': '#F20000', 'ZHO': '#F20000',
  'MAG': '#B6BABD', 'HUL': '#B6BABD',
};

export default function LaptimeRecordsView() {
  const [loading, setLoading] = useState(true);
  const [fastf1Data, setFastf1Data] = useState<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8765');
    
    ws.onopen = () => {
      console.log('Connected to backend for laptimes');
      ws.send(JSON.stringify({
        action: 'get_laptimes',
        year: 2023,
        gp: 'Monaco',
        session: 'R'
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.topic === 'LaptimesData') {
        setFastf1Data(msg.data);
        setLoading(false);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const lineData = React.useMemo(() => {
    const grouped: Record<string, {x: number[], y: number[]}> = {};
    fastf1Data.forEach(d => {
      if (!grouped[d.Driver]) {
        grouped[d.Driver] = { x: [], y: [] };
      }
      grouped[d.Driver].x.push(d.LapNumber);
      grouped[d.Driver].y.push(d.LapTime);
    });

    return Object.keys(grouped).map(driver => ({
      x: grouped[driver].x,
      y: grouped[driver].y,
      mode: 'lines',
      name: driver,
      line: { 
        color: (TEAM_COLORS as any)[driver] || '#888',
        width: 2 
      }
    }));
  }, [fastf1Data]);

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 20, r: 20, l: 40, b: 40 },
    xaxis: { 
      showgrid: false, 
      zeroline: false,
      tickfont: { color: '#64748b' }
    },
    yaxis: { 
      showgrid: true, 
      gridcolor: '#1e293b',
      zeroline: false,
      tickfont: { color: '#64748b' }
    },
    legend: {
      orientation: 'h',
      y: 1.1,
      font: { color: '#94a3b8' }
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col h-full w-full bg-[#0A0D14] items-center justify-center p-8">
             <div className="text-xl font-bold text-slate-400 mb-4 animate-pulse">Fetching 70+ laps of telemetry via FastF1...</div>
             <div className="text-xs text-slate-600">This requires processing official F1 data and may take 5-10 seconds.</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0D14] p-4 lg:p-8 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Lap Records</h2>
      </div>

      {/* Line Chart */}
      <div className="w-full h-[300px] lg:h-[400px] bg-[#0F131D] border border-slate-800 rounded-xl p-4 mb-8 relative">
        <h3 className="text-sm font-bold text-slate-400 absolute top-4 left-4 z-10">Laptime Evolution</h3>
        <Plot
          data={lineData as any}
          layout={layout as any}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-4 lg:gap-8">
        {/* Box Plots (Mock representation) */}
        <div className="bg-[#0F131D] border border-slate-800 rounded-xl p-4 h-[300px] flex items-center justify-center text-slate-500">
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl">📊</span>
            <span className="font-bold text-sm">Laptime Consistency Box Plots</span>
          </div>
        </div>

        {/* Fastest Laps Table */}
        <div className="bg-[#0F131D] border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-400 mb-4">Fastest Laps</h3>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-2 text-xs font-bold text-slate-500 border-b border-slate-800 pb-2">
              <span>Pos</span>
              <span>Driver</span>
              <span>Lap</span>
              <span>Time</span>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-2 py-2 items-center text-sm font-bold text-slate-200">
              <span className="text-slate-400">1</span>
              <span className="text-[#3671C6]">VER</span>
              <span className="text-slate-400">68</span>
              <span className="font-mono text-[#B138FF]">1:12.486</span>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-2 py-2 items-center text-sm font-bold text-slate-200">
              <span className="text-slate-400">2</span>
              <span className="text-[#E80020]">HAM</span>
              <span className="text-slate-400">65</span>
              <span className="font-mono">1:12.904</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
