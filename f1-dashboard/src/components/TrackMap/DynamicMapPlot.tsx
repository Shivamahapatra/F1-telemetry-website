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
      scaleratio: 1,
      range: [-300, 300]
    },
    dragmode: 'pan',
  };

  const [countdown, setCountdown] = React.useState('');
  
  React.useEffect(() => {
    // Countdown to an approximate FP1 time (for demo purposes)
    const targetDate = new Date('2026-06-05T17:30:00Z').getTime();
    
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
    <div className="w-full h-full relative">
      {timingData.length > 0 ? (
        <Plot
          data={plotData as any}
          layout={layout as any}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0D14] z-10 p-8 rounded-2xl border border-slate-800/50 m-4">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
               <span className="text-4xl">🚦</span>
            </div>
            
            <h2 className="text-4xl font-black text-white tracking-widest uppercase mb-2">Track is Empty</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-md text-center">F1 telemetry servers are online, but there are no cars on the circuit. Waiting for the next official session to begin.</p>
            
            <div className="bg-[#0F131D] border border-slate-700/50 px-12 py-6 rounded-xl flex flex-col items-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="text-xs font-bold tracking-[0.3em] text-[var(--color-neon-red)] uppercase mb-3">Next Event Starts In</span>
                <span className="text-5xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    {countdown}
                </span>
            </div>
            
            {/* Background Logo */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02]">
               <h1 className="text-[300px] font-black italic">F1</h1>
            </div>
        </div>
      )}
    </div>
  );
}
