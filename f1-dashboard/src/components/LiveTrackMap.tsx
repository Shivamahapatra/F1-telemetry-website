"use client";
import { useF1Telemetry } from "@/hooks/useF1Telemetry";

const teamColors: Record<string, string> = {
  VER: "#3671C6", HAM: "#E80020", LEC: "#E80020", NOR: "#FF8000", PIA: "#FF8000", RUS: "#27F4D2", ALO: "#229971"
};

export default function LiveTrackMap() {
  const { trackPositions, selectedDrivers } = useF1Telemetry();

  // Mapping minisectors (1-10)
  const minisectorMap: Record<number, {x: number, y: number}> = {
    1: {x: 50, y: 100}, 2: {x: 30, y: 80}, 3: {x: 30, y: 60}, 4: {x: 50, y: 50}, 
    5: {x: 100, y: 50}, 6: {x: 150, y: 50}, 7: {x: 170, y: 60}, 8: {x: 170, y: 80}, 
    9: {x: 150, y: 100}, 10: {x: 100, y: 100}
  };

  const getPosition = (driverData: any) => {
    if (!driverData) return { x: 0, y: 0, opacity: 0 };
    if (driverData.x && driverData.y) return { x: driverData.x, y: driverData.y, opacity: 1 };
    if (driverData.minisector && minisectorMap[driverData.minisector]) {
      return { ...minisectorMap[driverData.minisector], opacity: 1 };
    }
    return { x: 0, y: 0, opacity: 0 };
  };

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Live Track Position</h2>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 relative min-h-[250px]">
        <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          {/* Track Shape */}
          <path d="M 50 100 C 20 100 20 50 50 50 L 150 50 C 180 50 180 100 150 100 Z" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
          
          {/* Dynamic Cars based on Selection */}
          {selectedDrivers.map((drv) => {
            const pos = getPosition(trackPositions[drv]);
            const color = teamColors[drv] || "#ffffff";
            return (
              <g key={drv} style={{ transition: 'all 0.5s ease-in-out', opacity: pos.opacity }}>
                <circle 
                  cx={pos.x} cy={pos.y} r="4" fill={color} 
                  style={{ filter: `drop-shadow(0px 0px 8px ${color})` }} 
                />
                <text x={pos.x - 8} y={pos.y - 8} fill="white" fontSize="6" fontWeight="bold">{drv}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
