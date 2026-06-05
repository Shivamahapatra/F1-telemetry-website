"use client";
import React from 'react';
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

export default function LiveTrackMap() {
  const { trackPositions, selectedDrivers } = useF1Telemetry();

  const plotData = selectedDrivers.map(drv => {
    const pos = trackPositions[drv];
    const color = teamColors[drv] || "#ffffff";
    
    // If no position data yet, place them out of bounds or origin transparently
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
        size: 12,
        line: { color: '#ffffff', width: 1 }
      },
      textfont: {
        family: 'var(--font-sans)',
        size: 10,
        color: '#ffffff'
      },
      opacity: opacity,
      hoverinfo: 'name'
    };
  });

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 10, r: 10, l: 10, b: 10 },
    showlegend: false,
    xaxis: { 
      showgrid: false, 
      zeroline: false, 
      showticklabels: false,
      // Fixed range so the map doesn't jitter as cars move
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

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Live Track Position</h2>
      </div>
      <div className="flex-1 w-full relative min-h-[350px]">
        <div className="absolute inset-0">
          <Plot
            data={plotData as any}
            layout={layout as any}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </div>
      </div>
    </div>
  );
}
