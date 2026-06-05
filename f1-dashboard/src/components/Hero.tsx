"use client";
import { motion } from "framer-motion";

export default function Hero() {
  const channelLink = "https://www.youtube.com/@manjaniumonsofts67?sub_confirmation=1";

  return (
    <section className="relative w-full py-16 flex flex-col xl:flex-row items-center justify-center gap-10 text-center xl:text-left overflow-hidden bg-slate-900 border-b border-slate-800">
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-0"></div>
      
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 flex flex-col items-center xl:items-start max-w-xl px-4"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
          <span className="text-white">LIVE F1</span>
          <span className="text-[var(--color-neon-red)]">.HUB</span>
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          The ultimate real-time telemetry dashboard. Watch the live stream and track the data like the pit-wall.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <motion.a 
            href={channelLink}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255, 42, 42, 0.7)" }}
            whileTap={{ scale: 0.95 }}
            className="inline-block bg-[var(--color-neon-red)] text-white font-bold py-4 px-8 rounded-full shadow-[0_0_15px_rgba(255,42,42,0.5)] transition-all"
          >
            Subscribe on YouTube
          </motion.a>
          <div className="flex flex-col items-center xl:items-start">
            <span className="text-[var(--color-neon-red)] font-black text-2xl animate-pulse">● LIVE</span>
            <span className="text-slate-500 text-sm">Join the stream!</span>
          </div>
        </div>
      </motion.div>

      {/* YouTube Video Embed */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="z-10 w-full max-w-3xl aspect-video rounded-xl overflow-hidden border-2 border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
      >
        <iframe 
          width="100%" 
          height="100%" 
          src="https://www.youtube.com/embed/live_stream?channel=UCYOURCHANNELIDHERE" 
          title="YouTube live video player" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen>
        </iframe>
      </motion.div>
    </section>
  );
}
