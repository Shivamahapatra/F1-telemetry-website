import React from 'react';

interface LeftNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function LeftNavigation({ activeTab, setActiveTab }: LeftNavProps) {
  return (
    <div className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
      <div>
        <h1 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
          <span className="text-[var(--color-neon-red)]">MANJANIUM</span> TELEMETRY
        </h1>
        <p className="text-xs text-slate-500 font-bold tracking-widest mt-1 uppercase">Live Timing Dashboard</p>
      </div>

      <nav className="flex flex-col gap-2">
        <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Live Timing" icon="((•))" />
        <NavItem active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} label="Race Calendar" icon="📅" />
        <NavItem active={activeTab === 'news'} onClick={() => setActiveTab('news')} label="News" icon="📰" />
        
        <div className="mt-4 mb-2 text-xs font-bold text-slate-600 tracking-widest uppercase">Race Analysis</div>
        <NavItem active={activeTab === 'laptimes'} onClick={() => setActiveTab('laptimes')} label="Laptime Records" icon="⏱️" />
        <NavItem active={activeTab === 'telemetry'} onClick={() => setActiveTab('telemetry')} label="Telemetry" icon="📈" />
        <NavItem active={activeTab === 'results'} onClick={() => setActiveTab('results')} label="Race Results" icon="🏁" />
        <NavItem active={activeTab === 'replay'} onClick={() => setActiveTab('replay')} label="Replay" icon="▶" />

        <div className="mt-4 mb-2 text-xs font-bold text-slate-600 tracking-widest uppercase">Championship</div>
        <NavItem active={activeTab === 'driver_standings'} onClick={() => setActiveTab('driver_standings')} label="Driver Standings" icon="" />
        <NavItem active={activeTab === 'constructor_standings'} onClick={() => setActiveTab('constructor_standings')} label="Constructors Standings" icon="" />
      </nav>
    </div>
  );
}

function NavItem({ active, label, icon, onClick }: { active?: boolean, label: string, icon: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-2.5 rounded-xl font-bold transition-all text-sm w-full text-left ${
      active 
        ? 'bg-[var(--color-neon-red)]/10 text-[var(--color-neon-red)] border border-[var(--color-neon-red)]/20 shadow-[0_0_15px_rgba(255,42,42,0.1)]' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
    }`}>
      {icon && <span className="w-5 text-center">{icon}</span>}
      <span className={icon ? "" : "ml-9"}>{label}</span>
    </button>
  );
}
