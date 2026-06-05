import React from 'react';
import TopWeatherBar from "@/components/Header/TopWeatherBar";
import DynamicMapPlot from "@/components/TrackMap/DynamicMapPlot";
import LiveTimingSidebar from "@/components/TimingTower/LiveTimingSidebar";

import RaceControlsView from "@/components/TimingTower/RaceControlsView";

export default function LiveTimingView() {
  return (
    <div className="grid grid-cols-[35%_45%_20%] grid-rows-[auto_1fr] h-full w-full">
      {/* Top Header spans across Left & Middle */}
      <div className="col-span-2 row-start-1 border-b border-slate-800/50 bg-[#0F131D]">
        <TopWeatherBar />
      </div>

      {/* Timing Tower takes the left column (wide) */}
      <div className="col-start-1 row-start-2 border-r border-slate-800/50 bg-[#0A0D14] overflow-hidden">
        <LiveTimingSidebar />
      </div>

      {/* Track Map takes the middle column */}
      <div className="col-start-2 row-start-2 relative p-4 overflow-hidden bg-[#0A0D14]">
        <DynamicMapPlot />
      </div>

      {/* Race Controls takes the right column (spans both rows) */}
      <div className="col-start-3 row-span-2 row-start-1 border-l border-slate-800/50 bg-[#0F131D] overflow-hidden">
        <RaceControlsView />
      </div>
    </div>
  );
}
