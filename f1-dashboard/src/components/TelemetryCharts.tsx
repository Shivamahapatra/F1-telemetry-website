"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function TelemetryCharts() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/data/telemetry_sample.json')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error("Failed to load telemetry data", err));
  }, []);

  if (!data) {
    return (
      <div className="glass-panel p-6 rounded-2xl min-h-[500px] flex items-center justify-center">
        <div className="animate-pulse text-slate-400 font-bold tracking-widest uppercase">Loading Telemetry...</div>
      </div>
    );
  }

  const createTrace = (driverData: any[], yKey: string, color: string, name: string) => ({
    x: driverData.map(d => d.Time),
    y: driverData.map(d => d[yKey]),
    type: 'scatter',
    mode: 'lines',
    name: name,
    line: { color: color, width: 2 },
    hoverinfo: 'name+y'
  });

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8', family: 'var(--font-sans)' },
    margin: { t: 10, r: 20, l: 50, b: 40 },
    hovermode: 'x unified',
    showlegend: true,
    legend: { orientation: 'h', y: 1.05, font: { color: '#f8fafc' } },
    xaxis: { showgrid: true, gridcolor: '#334155', title: 'Time (s)', anchor: 'y3' },
    yaxis: { title: 'Speed (km/h)', showgrid: true, gridcolor: '#334155', domain: [0.7, 1] },
    yaxis2: { title: 'Gear', showgrid: true, gridcolor: '#334155', domain: [0.35, 0.65], tickvals: [1,2,3,4,5,6,7,8] },
    yaxis3: { title: 'Throttle %', showgrid: true, gridcolor: '#334155', domain: [0, 0.3], range: [0, 105] },
  };

  const plotData = [
    // Speed
    { ...createTrace(data.VER, 'Speed', 'var(--color-neon-blue)', 'VER Speed'), xaxis: 'x', yaxis: 'y' },
    { ...createTrace(data.HAM, 'Speed', 'var(--color-neon-green)', 'HAM Speed'), xaxis: 'x', yaxis: 'y' },
    
    // Gear
    { ...createTrace(data.VER, 'Gear', 'var(--color-neon-blue)', 'VER Gear'), xaxis: 'x', yaxis: 'y2' },
    { ...createTrace(data.HAM, 'Gear', 'var(--color-neon-green)', 'HAM Gear'), xaxis: 'x', yaxis: 'y2' },
    
    // Throttle
    { ...createTrace(data.VER, 'Throttle', 'var(--color-neon-blue)', 'VER Throttle'), xaxis: 'x', yaxis: 'y3' },
    { ...createTrace(data.HAM, 'Throttle', 'var(--color-neon-green)', 'HAM Throttle'), xaxis: 'x', yaxis: 'y3' },
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl w-full h-full min-h-[600px] flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-wider">Interactive Telemetry Traces</h2>
      <div className="flex-1 w-full relative">
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
