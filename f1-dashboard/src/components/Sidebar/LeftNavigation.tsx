import React from 'react';

interface LeftNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function LeftNavigation({ activeTab, setActiveTab }: LeftNavProps) {
  return (
    <div className="flex-1 p-4 lg:p-6 flex flex-col gap-4 lg:gap-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="flex items-center justify-between lg:block">
        <h1 className="text-lg lg:text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
          <span className="text-[var(--color-neon-red)]">MANJANIUM</span> TELEMETRY
        </h1>
        <p className="hidden lg:block text-xs text-slate-500 font-bold tracking-widest mt-1 uppercase">Live Timing Dashboard</p>
      </div>

      <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar">
        <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Live Timing" icon="((•))" />
        <NavItem active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} label="Race Calendar" icon="📅" />
        <NavItem active={activeTab === 'news'} onClick={() => setActiveTab('news')} label="News" icon="📰" />
        
        <div className="hidden lg:block mt-4 mb-2 text-xs font-bold text-slate-600 tracking-widest uppercase">Race Analysis</div>
        <NavItem active={activeTab === 'laptimes'} onClick={() => setActiveTab('laptimes')} label="Laptime Records" icon="⏱️" />
        <NavItem active={activeTab === 'telemetry'} onClick={() => setActiveTab('telemetry')} label="Telemetry" icon="📈" />
        <NavItem active={activeTab === 'results'} onClick={() => setActiveTab('results')} label="Race Results" icon="🏁" />
        <NavItem active={activeTab === 'replay'} onClick={() => setActiveTab('replay')} label="Replay" icon="▶" />

        <div className="hidden lg:block mt-4 mb-2 text-xs font-bold text-slate-600 tracking-widest uppercase">Championship</div>
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
      className={`flex items-center gap-2 lg:gap-4 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold transition-all text-xs lg:text-sm w-auto lg:w-full text-left whitespace-nowrap shrink-0 ${
      active 
        ? 'bg-[var(--color-neon-red)]/10 text-[var(--color-neon-red)] border border-[var(--color-neon-red)]/20 shadow-[0_0_15px_rgba(255,42,42,0.1)]' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
    }`}>
      {icon && <span className="w-4 lg:w-5 text-center">{icon}</span>}
      <span className={icon ? "" : "lg:ml-9"}>{label}</span>
    </button>
  );
}
