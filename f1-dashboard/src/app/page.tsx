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
    <main className="h-screen w-screen overflow-hidden bg-[#0A0D14] text-white flex flex-col lg:flex-row">
      {/* Responsive Sidebar - Horizontal on Mobile, Vertical on Desktop */}
      <div className="w-full lg:w-[15%] lg:min-w-[240px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/50 flex flex-col bg-[#0F131D]">
        <LeftNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="hidden lg:block">
            <YouTubeHub />
        </div>
      </div>

      {/* Dynamic Main Content Area */}
      <div className="flex-1 relative overflow-y-auto lg:overflow-hidden bg-[#0A0D14]">
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
