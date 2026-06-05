import React from 'react';
import TopWeatherBar from "@/components/Header/TopWeatherBar";
import DynamicMapPlot from "@/components/TrackMap/DynamicMapPlot";
import LiveTimingSidebar from "@/components/TimingTower/LiveTimingSidebar";

import RaceControlsView from "@/components/TimingTower/RaceControlsView";

export default function LiveTimingView() {
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[35%_45%_20%] lg:grid-rows-[auto_1fr] h-full w-full overflow-y-auto lg:overflow-hidden">
      {/* Top Header spans across Left & Middle on desktop */}
      <div className="lg:col-span-2 lg:row-start-1 border-b border-slate-800/50 bg-[#0F131D]">
        <TopWeatherBar />
      </div>

      {/* Timing Tower takes the left column (wide) on desktop */}
      <div className="lg:col-start-1 lg:row-start-2 border-b lg:border-b-0 lg:border-r border-slate-800/50 bg-[#0A0D14] overflow-x-auto lg:overflow-hidden min-h-[400px]">
        <LiveTimingSidebar />
      </div>

      {/* Track Map takes the middle column */}
      <div className="lg:col-start-2 lg:row-start-2 relative p-4 overflow-hidden bg-[#0A0D14] min-h-[500px]">
        <DynamicMapPlot />
      </div>

      {/* Race Controls takes the right column */}
      <div className="lg:col-start-3 lg:row-span-2 lg:row-start-1 border-t lg:border-t-0 lg:border-l border-slate-800/50 bg-[#0F131D] overflow-hidden min-h-[400px]">
        <RaceControlsView />
      </div>
    </div>
  );
}
