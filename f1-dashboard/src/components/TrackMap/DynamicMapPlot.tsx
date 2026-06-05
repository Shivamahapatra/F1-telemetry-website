"use client";
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useF1Telemetry } from "@/hooks/useF1Telemetry";

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const teamColors: Record<string, string> = {
  VER: "#3671C6", PER: "#3671C6",
  HAM: "#E80020", LEC: "#E80020", SAI: "#E80020",
  NOR: "#FF8000", PIA: "#FF8000", 
  RUS: "#27F4D2", 
  ALO: "#229971", STR: "#229971",
  GAS: "#0090FF", OCO: "#0090FF",
  ALB: "#005AFF", SAR: "#005AFF",
  BOT: "#52E252", ZHO: "#52E252",
  MAG: "#FFFFFF", HUL: "#FFFFFF",
  TSU: "#6692FF", RIC: "#6692FF"
};

export default function DynamicMapPlot() {
  const { trackPositions, timingData } = useF1Telemetry();

  const drivers = timingData.length > 0 ? timingData.map(d => d.driver) : Object.keys(teamColors);

  const plotData = useMemo(() => {
    return drivers.map(drv => {
      const pos = trackPositions[drv];
      const color = teamColors[drv] || "#ffffff";
      
      const x = pos?.x ?? 0;
      const y = pos?.y ?? 0;
      const opacity = pos?.x !== undefined ? 1 : 0;

      return {
        x: [x],
        y: [y],
        type: 'scatter',
        mode: 'markers+text',
        name: drv,
        text: [drv],
        textposition: 'top center',
        marker: { 
          color: color, 
          size: 14,
          line: { color: '#ffffff', width: 2 }
        },
        textfont: {
          family: 'var(--font-sans)',
          size: 12,
          color: '#ffffff',
          weight: 'bold'
        },
        opacity: opacity,
        hoverinfo: 'name'
      };
    });
  }, [trackPositions, drivers]);

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 0, r: 0, l: 0, b: 0 },
    showlegend: false,
    xaxis: { 
      showgrid: false, 
      zeroline: false, 
      showticklabels: false,
      range: [-600, 600] 
    },
    yaxis: { 
      showgrid: false, 
      zeroline: false, 
      showticklabels: false,
      scaleanchor: 'x', 
      range: [-300, 300]
    },
    dragmode: 'pan',
  };

  const [countdown, setCountdown] = React.useState('LOADING...');
  
  React.useEffect(() => {
    // Exact target time based on accurate session schedule
    const targetDate = new Date('2026-06-05T15:00:00Z').getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance < 0) {
        setCountdown('SESSION IMMINENT');
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setCountdown(`${days}D ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full relative flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
      {timingData.length > 0 ? (
        <Plot
          data={plotData as any}
          layout={layout as any}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      ) : (
        <>
            {/* Session Info Card */}
            <div className="bg-[#0F131D] border border-green-900/50 rounded-lg p-4 flex flex-col relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-4 h-4 rounded-full border border-green-500 flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </span>
                    <span className="text-[10px] text-green-500 font-bold tracking-widest uppercase">Track Clear</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-4">Canadian Grand Prix : Practice 1</h2>
                <div className="flex gap-4 items-center">
                    <div className="bg-slate-800/50 border border-slate-700 px-3 py-1 rounded text-xs text-slate-300 flex items-center gap-2">
                        <span className="text-[10px]">...</span> Session Ends
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 px-3 py-1 rounded text-xs text-slate-300 font-bold flex items-center gap-2">
                        Montreal <span className="font-mono text-green-400">00:00:00</span>
                    </div>
                    <div className="ml-auto text-xs font-mono font-bold text-[var(--color-neon-red)] bg-red-900/20 px-3 py-1 rounded border border-red-800">
                        OFFLINE IN: {countdown}
                    </div>
                </div>
            </div>

            {/* Static Map View */}
            <div className="bg-[#0F131D] border border-slate-800 rounded-lg h-[300px] relative flex items-center justify-center">
                 <div className="absolute top-4 right-4 flex items-center gap-2">
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Show Corners</span>
                     <div className="w-8 h-4 bg-blue-600 rounded-full relative cursor-pointer">
                         <div className="w-3 h-3 bg-white rounded-full absolute right-[2px] top-[2px]"></div>
                     </div>
                 </div>
                 
                 {/* Dummy Track Path SVG */}
                 <svg width="60%" height="80%" viewBox="0 0 100 100" preserveAspectRatio="none" className="opacity-40">
                    <path d="M10,50 Q20,20 50,20 T90,50 Q80,80 50,80 T10,50" fill="none" stroke="#475569" strokeWidth="2" />
                    {/* Dummy Corners */}
                    <circle cx="10" cy="50" r="3" fill="#0F131D" stroke="#fff" strokeWidth="1" />
                    <text x="10" y="45" fill="#fff" fontSize="4" textAnchor="middle">1</text>
                 </svg>
            </div>

            {/* Circular Telemetry / Gaps */}
            <div className="bg-[#0F131D] border border-slate-800 rounded-lg flex-1 relative flex items-center justify-center min-h-[300px]">
                <div className="w-48 h-48 rounded-full border border-slate-600 relative flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border border-slate-700/50"></div>
                    
                    {/* Dummy Cars on Circle */}
                    <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className="text-[8px] font-bold text-slate-400 mb-1">IN PIT</span>
                        <div className="w-6 h-6 rounded-full border-2 border-[#E80020] bg-slate-900 text-[8px] font-bold text-white flex items-center justify-center">LEC</div>
                    </div>
                    
                    <div className="absolute bottom-[-10px] right-4 flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full border-2 border-[#3671C6] bg-slate-900 text-[8px] font-bold text-white flex items-center justify-center">VER</div>
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
}
