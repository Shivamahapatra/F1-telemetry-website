import React from 'react';
import TopWeatherBar from "@/components/Header/TopWeatherBar";
import DynamicMapPlot from "@/components/TrackMap/DynamicMapPlot";
import LiveTimingSidebar from "@/components/TimingTower/LiveTimingSidebar";

export default function LiveTimingView() {
  return (
    <div className="grid grid-cols-[70%_30%] grid-rows-[auto_1fr] h-full w-full">
      {/* Top Header spans only the left column */}
      <div className="col-start-1 row-start-1 border-b border-slate-800/50 bg-[#0F131D]">
        <TopWeatherBar />
      </div>

      {/* Track Map takes the rest of the left column */}
      <div className="col-start-1 row-start-2 relative p-4 overflow-hidden">
        <DynamicMapPlot />
      </div>

      {/* Timing Tower spans both rows on the right */}
      <div className="col-start-2 row-span-2 row-start-1 border-l border-slate-800/50 bg-[#0F131D]">
        <LiveTimingSidebar />
      </div>
    </div>
  );
}
