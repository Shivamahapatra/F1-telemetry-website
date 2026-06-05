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

  return (
    <div className="w-full h-full relative">
      <Plot
        data={plotData as any}
        layout={layout as any}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
      {/* Optional: Add a subtle logo or watermark in the background of the map */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
        <h1 className="text-[150px] font-black italic">F1</h1>
      </div>
    </div>
  );
}
