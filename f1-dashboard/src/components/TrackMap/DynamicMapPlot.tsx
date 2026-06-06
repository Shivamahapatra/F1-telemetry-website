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
  const { trackPositions, timingData, sessionInfo, trackCoords } = useF1Telemetry();

  const drivers = timingData.length > 0 ? timingData.map(d => d.driver) : Object.keys(teamColors);

  const plotData = useMemo(() => {
    const trackTrace = {
      x: trackCoords?.map(p => p.x) || [],
      y: trackCoords?.map(p => p.y) || [],
      type: 'scatter',
      mode: 'lines',
      name: 'Track',
      line: { color: 'rgba(255,255,255,0.3)', width: 4 },
      hoverinfo: 'none'
    };

    const driverTraces = drivers.map(drv => {
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

    return [trackTrace, ...driverTraces];
  }, [trackPositions, drivers, trackCoords]);

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 0, r: 0, l: 0, b: 0 },
    showlegend: false,
    xaxis: { 
      showgrid: false, 
      zeroline: false, 
      showticklabels: false,
      autorange: true,
      fixedrange: false
    },
    yaxis: { 
      showgrid: false, 
      zeroline: false, 
      showticklabels: false,
      scaleanchor: 'x', 
      scaleratio: 1,
      autorange: true,
      fixedrange: false
    },
    dragmode: 'pan',
  };

  return (
    <div className="w-full h-full relative flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
      {/* Session Info Card */}
      <div className="bg-[#0F131D] border border-green-900/50 rounded-lg p-4 flex flex-col relative overflow-hidden shrink-0 shadow-lg">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
          <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 rounded-full border border-green-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </span>
              <span className="text-[10px] text-green-500 font-bold tracking-widest uppercase">
                  {sessionInfo.status === 'Green' ? 'Track Clear' : sessionInfo.status || 'Connecting...'}
              </span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">
              {sessionInfo.name || 'Connecting to Live Session...'}
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
              <div className="bg-slate-800/50 border border-slate-700 px-3 py-1 rounded text-xs text-slate-300 flex items-center gap-2">
                  <span className="text-[10px]">LAPS</span>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 px-3 py-1 rounded text-xs text-slate-300 font-bold flex items-center gap-2">
                  <span className="font-mono text-green-400">
                      {sessionInfo.lap || 0} / {sessionInfo.totalLaps || '?'}
                  </span>
              </div>
          </div>
      </div>

      {/* Map Plot */}
      <div className="bg-[#0F131D] border border-slate-800 rounded-lg flex-1 min-h-[400px] relative shadow-lg">
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Map</span>
              <div className="w-2 h-2 bg-[var(--color-neon-red)] rounded-full animate-pulse"></div>
          </div>
          <Plot
            data={plotData as any}
            layout={layout as any}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
      </div>
    </div>
  );
}
