"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { useF1Telemetry } from "@/hooks/useF1Telemetry";
import DriverSelector from "./DriverSelector";

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const teamColors: Record<string, string> = {
  VER: "#3671C6", HAM: "#E80020", LEC: "#E80020", NOR: "#FF8000", PIA: "#FF8000", RUS: "#27F4D2", ALO: "#229971"
};

export default function LiveTelemetryCharts() {
  const { telemetryState, timingData, selectedDrivers, setSelectedDrivers } = useF1Telemetry();

  const availableDrivers = timingData.map(d => d.driver);
  // Fallback to defaults if timingData is empty
  const driversToList = availableDrivers.length > 0 ? availableDrivers : ['VER', 'HAM'];

  const createTrace = (driverData: any[], yKey: string, color: string, name: string) => ({
    x: driverData?.map(d => d.time || d.lapTime) || [],
    y: driverData?.map(d => d[yKey]) || [],
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
    xaxis: { showgrid: true, gridcolor: '#334155', title: 'Time', anchor: 'y3' },
    yaxis: { title: 'Speed (km/h)', showgrid: true, gridcolor: '#334155', domain: [0.7, 1] },
    yaxis2: { title: 'RPM', showgrid: true, gridcolor: '#334155', domain: [0.35, 0.65] },
    yaxis3: { title: 'Gear', showgrid: true, gridcolor: '#334155', domain: [0, 0.3] },
  };

  const plotData = selectedDrivers.flatMap(drv => {
    const data = telemetryState[drv] || [];
    const color = teamColors[drv] || "#ffffff";
    return [
      { ...createTrace(data, 'speed', color, `${drv} Speed`), xaxis: 'x', yaxis: 'y' },
      { ...createTrace(data, 'rpm', color, `${drv} RPM`), xaxis: 'x', yaxis: 'y2' },
      { ...createTrace(data, 'gear', color, `${drv} Gear`), xaxis: 'x', yaxis: 'y3' },
    ];
  });

  return (
    <div className="glass-panel p-6 rounded-2xl w-full h-full min-h-[600px] flex flex-col shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Live Telemetry Traces</h2>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-neon-red)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-neon-red)]"></span>
          </span>
          <span className="text-xs text-[var(--color-neon-red)] font-bold tracking-widest">LIVE DATA</span>
        </div>
      </div>
      
      <DriverSelector 
        availableDrivers={driversToList} 
        selectedDrivers={selectedDrivers} 
        onChange={setSelectedDrivers} 
      />

      <div className="flex-1 w-full relative min-h-[400px]">
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
