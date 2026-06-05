"use client";

interface DriverData {
  driver: string;
  lapTime: string;
  maxSpeed: number;
  maxRpm: number;
  color: string;
}

export default function LapComparison() {
  const drivers: DriverData[] = [
    { driver: "VER", lapTime: "1:25.000", maxSpeed: 334.5, maxRpm: 12150, color: "var(--color-neon-blue)" },
    { driver: "HAM", lapTime: "1:25.500", maxSpeed: 330.1, maxRpm: 12000, color: "var(--color-neon-green)" }
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider">Lap Comparison</h2>
      <div className="flex-1 flex flex-col gap-6">
        {drivers.map((d) => (
          <div key={d.driver} className="flex flex-col bg-slate-900/50 p-4 rounded-xl border-l-4" style={{ borderColor: d.color }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-black drop-shadow-md" style={{ color: d.color }}>{d.driver}</span>
              <span className="text-xl font-bold text-white">{d.lapTime}</span>
            </div>
            <div className="flex justify-between text-slate-300 text-sm">
              <div className="flex flex-col">
                <span className="text-slate-500 uppercase text-xs">Top Speed</span>
                <span className="font-semibold text-[1.1rem]">{d.maxSpeed} km/h</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-slate-500 uppercase text-xs">Max RPM</span>
                <span className="font-semibold text-[1.1rem]">{d.maxRpm}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
