import LeftNavigation from "@/components/Sidebar/LeftNavigation";
import YouTubeHub from "@/components/Sidebar/YouTubeHub";
import TopWeatherBar from "@/components/Header/TopWeatherBar";
import DynamicMapPlot from "@/components/TrackMap/DynamicMapPlot";
import LiveTimingSidebar from "@/components/TimingTower/LiveTimingSidebar";

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0A0D14] text-white">
      <div className="grid grid-cols-[15%_60%_25%] grid-rows-[auto_1fr] h-full">
        
        {/* Left Sidebar spans both rows */}
        <div className="row-span-2 border-r border-slate-800/50 flex flex-col bg-[#0F131D]">
          <LeftNavigation />
          <YouTubeHub />
        </div>

        {/* Top Header spans only the middle column */}
        <div className="col-start-2 row-start-1 border-b border-slate-800/50 bg-[#0F131D]">
          <TopWeatherBar />
        </div>

        {/* Track Map takes the rest of the middle column */}
        <div className="col-start-2 row-start-2 relative p-4 overflow-hidden">
          <DynamicMapPlot />
        </div>

        {/* Timing Tower spans both rows on the right */}
        <div className="col-start-3 row-span-2 row-start-1 border-l border-slate-800/50 bg-[#0F131D]">
          <LiveTimingSidebar />
        </div>

      </div>
    </main>
  );
}
