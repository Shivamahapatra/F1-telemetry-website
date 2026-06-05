import React from 'react';

export default function LeftNavigation() {
  return (
    <div className="flex-1 p-6 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black italic tracking-tighter text-white flex items-center gap-2">
          <span className="text-[var(--color-neon-red)]">F1</span> CONSOLE
        </h1>
        <p className="text-xs text-slate-500 font-bold tracking-widest mt-1">LIVE TIMING</p>
      </div>

      <nav className="flex flex-col gap-2">
        <NavItem active label="Dashboard" icon="🏁" />
        <NavItem label="Simulate" icon="🏎️" />
        <NavItem label="Telemetry" icon="📊" />
        <NavItem label="Schedule" icon="📅" />
      </nav>
    </div>
  );
}

function NavItem({ active, label, icon }: { active?: boolean, label: string, icon: string }) {
  return (
    <button className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
      active 
        ? 'bg-[var(--color-neon-red)]/10 text-[var(--color-neon-red)] border border-[var(--color-neon-red)]/20 shadow-[0_0_15px_rgba(255,42,42,0.1)]' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`}>
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
