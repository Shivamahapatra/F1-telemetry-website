"use client";
import React from 'react';

export default function YouTubeHub() {
  const channelLink = "https://www.youtube.com/@manjaniumonsofts67?sub_confirmation=1";
  const playlistUrl = "https://www.youtube.com/embed/4LaFsg9s7dM";

  return (
    <div className="p-6 border-t border-slate-800/50 bg-[#0A0D14]/50 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-[var(--color-neon-red)] flex items-center justify-center text-white">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
        </div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Channel Hub</h3>
      </div>
      
      <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-800 relative">
        <iframe 
          width="100%" 
          height="100%" 
          src={playlistUrl} 
          title="YouTube video player" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen>
        </iframe>
      </div>

      <a 
        href={channelLink}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full text-center bg-[var(--color-neon-red)] hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_15px_rgba(255,42,42,0.3)] transition-all uppercase text-sm tracking-widest"
      >
        Subscribe
      </a>
    </div>
  );
}
