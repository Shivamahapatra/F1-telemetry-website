"use client";

interface DriverSelectorProps {
  availableDrivers: string[];
  selectedDrivers: string[];
  onChange: (drivers: string[]) => void;
}

export default function DriverSelector({ availableDrivers, selectedDrivers, onChange }: DriverSelectorProps) {
  const toggleDriver = (driver: string) => {
    if (selectedDrivers.includes(driver)) {
      if (selectedDrivers.length > 1) {
         onChange(selectedDrivers.filter(d => d !== driver));
      }
    } else {
      onChange([...selectedDrivers, driver]);
    }
  };

  return (
    <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-2 items-center mb-4">
      <span className="text-white font-bold uppercase tracking-wider mr-4 text-sm">Compare Drivers:</span>
      {availableDrivers.map(drv => {
        const isSelected = selectedDrivers.includes(drv);
        return (
          <button
            key={drv}
            onClick={() => toggleDriver(drv)}
            className={`px-3 py-1 rounded font-bold text-sm transition-all ${
              isSelected 
                ? 'bg-[var(--color-neon-blue)] text-white shadow-[0_0_10px_var(--color-neon-blue)]' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {drv}
          </button>
        );
      })}
    </div>
  );
}
