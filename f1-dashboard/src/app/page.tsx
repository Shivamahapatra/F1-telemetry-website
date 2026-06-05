import Hero from "@/components/Hero";
import LiveLeaderboard from "@/components/LiveLeaderboard";
import LiveTrackMap from "@/components/LiveTrackMap";
import LiveTelemetryCharts from "@/components/LiveTelemetryCharts";

export default function Home() {
  return (
    <main className="min-h-screen pb-10 flex flex-col gap-6 max-w-[1600px] mx-auto bg-slate-950">
      {/* Top: YouTube Hub Hero Section */}
      <Hero />

      <div className="px-4 md:px-8 flex flex-col gap-8">
        {/* Middle: Live Timing & Track Map */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LiveLeaderboard />
          <LiveTrackMap />
        </section>

        {/* Bottom: Live Telemetry Charts */}
        <section className="w-full">
          <LiveTelemetryCharts />
        </section>
      </div>
    </main>
  );
}
