"use client";
import React, { useState } from 'react';
import LeftNavigation from "@/components/Sidebar/LeftNavigation";
import YouTubeHub from "@/components/Sidebar/YouTubeHub";
import LiveTimingView from "@/components/Views/LiveTimingView";
import CalendarView from "@/components/Views/CalendarView";
import NewsView from "@/components/Views/NewsView";
import RaceResultsView from "@/components/Views/RaceResultsView";
import LaptimeRecordsView from "@/components/Views/LaptimeRecordsView";
import DriverStandingsView from "@/components/Views/DriverStandingsView";
import ConstructorStandingsView from "@/components/Views/ConstructorStandingsView";
import TelemetryView from "@/components/Views/TelemetryView";
import ReplayView from "@/components/Views/ReplayView";

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0A0D14] text-white flex">
      {/* Fixed Left Sidebar - 15% Width */}
      <div className="w-[15%] min-w-[240px] h-full border-r border-slate-800/50 flex flex-col bg-[#0F131D]">
        <LeftNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <YouTubeHub />
      </div>

      {/* Dynamic Main Content Area - 85% Width */}
      <div className="flex-1 h-full relative overflow-hidden bg-[#0A0D14]">
        {activeTab === 'dashboard' && <LiveTimingView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'news' && <NewsView />}
        {activeTab === 'results' && <RaceResultsView />}
        {activeTab === 'laptimes' && <LaptimeRecordsView />}
        {activeTab === 'telemetry' && <TelemetryView />}
        {activeTab === 'replay' && <ReplayView />}
        {activeTab === 'driver_standings' && <DriverStandingsView />}
        {activeTab === 'constructor_standings' && <ConstructorStandingsView />}
      </div>
    </main>
  );
}
