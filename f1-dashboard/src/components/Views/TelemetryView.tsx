"use client";
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function TelemetryView() {
  const [loading, setLoading] = useState(true);
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [driver, setDriver] = useState('VER');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8765');
    setLoading(true);
    
    ws.onopen = () => {
      console.log('Connected to backend for telemetry');
      ws.send(JSON.stringify({
        action: 'get_telemetry',
        year: 2023,
        gp: 'Monaco',
        session: 'Q',
        driver: driver
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.topic === 'TelemetryData') {
        setTelemetryData(msg.data);
        setLoading(false);
      } else if (msg.topic === 'Error') {
        console.error(msg.data);
        setLoading(false);
      }
    };

    return () => {
      ws.close();
    };
  }, [driver]);

  const { speedTrace, throttleTrace, brakeTrace } = React.useMemo(() => {
    const x = telemetryData.map(d => d.Distance);
    return {
      speedTrace: {
        x, y: telemetryData.map(d => d.Speed),
        mode: 'lines', name: 'Speed (km/h)', line: { color: '#B138FF', width: 2 }
      },
      throttleTrace: {
        x, y: telemetryData.map(d => d.Throttle),
        mode: 'lines', name: 'Throttle (%)', line: { color: '#22C55E', width: 2 }
      },
      brakeTrace: {
        x, y: telemetryData.map(d => d.Brake ? 100 : 0),
        mode: 'lines', name: 'Brake', line: { color: '#EF4444', width: 2, shape: 'hv' }
      }
    };
  }, [telemetryData]);

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 20, r: 20, l: 40, b: 40 },
    grid: { rows: 3, columns: 1, pattern: 'independent' },
    xaxis: { showgrid: false, zeroline: false, tickfont: { color: '#64748b' } },
    yaxis: { title: 'Speed', gridcolor: '#1e293b', tickfont: { color: '#64748b' } },
    xaxis2: { showgrid: false, zeroline: false, tickfont: { color: '#64748b' } },
    yaxis2: { title: 'Throttle', gridcolor: '#1e293b', tickfont: { color: '#64748b' }, range: [0, 105] },
    xaxis3: { showgrid: false, zeroline: false, tickfont: { color: '#64748b' } },
    yaxis3: { title: 'Brake', gridcolor: '#1e293b', tickfont: { color: '#64748b' }, range: [-5, 105] },
    showlegend: false,
  };

  // Adjust traces for subplots
  const plotData = [
    { ...speedTrace, xaxis: 'x1', yaxis: 'y1' },
    { ...throttleTrace, xaxis: 'x2', yaxis: 'y2' },
    { ...brakeTrace, xaxis: 'x3', yaxis: 'y3' }
  ];

  if (loading) {
    return (
        <div className="flex flex-col h-full w-full bg-[#0A0D14] items-center justify-center p-8">
             <div className="text-xl font-bold text-slate-400 mb-4 animate-pulse">Fetching high-res telemetry via FastF1...</div>
             <div className="text-xs text-slate-600">Generating speed, throttle, and brake traces for {driver}</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0D14] p-8 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Fastest Lap Telemetry</h2>
        <div className="flex items-center gap-4">
            <select 
              value={driver} 
              onChange={e => setDriver(e.target.value)}
              className="bg-[#0F131D] text-slate-200 border border-slate-700 px-4 py-2 rounded-lg"
            >
                <option value="VER">Max Verstappen</option>
                <option value="HAM">Lewis Hamilton</option>
                <option value="ALO">Fernando Alonso</option>
                <option value="LEC">Charles Leclerc</option>
            </select>
            <div className="text-right">
                <div className="text-xs text-[var(--color-neon-red)] font-bold uppercase tracking-widest animate-pulse">Live API Connected</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Python FastF1</div>
            </div>
        </div>
      </div>

      <div className="w-full h-[600px] bg-[#0F131D] border border-slate-800 rounded-xl p-4 shadow-2xl relative">
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
