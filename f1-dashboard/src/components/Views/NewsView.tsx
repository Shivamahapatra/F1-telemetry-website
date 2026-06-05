"use client";
import React, { useState, useEffect } from 'react';

const newsSources = [
  { id: 'motorsport', icon: 'M', label: 'Motorsport', active: true },
  { id: 'planetf1', icon: '🏎️', label: 'PlanetF1', active: false },
  { id: 'f1com', icon: 'F1', label: 'F1.com', active: false },
];

const timeAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
};

export default function NewsView() {
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Motorsport.com RSS via free proxy
    const rssUrl = "https://www.motorsport.com/rss/f1/news/";
    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setArticles(data.items);
          setSelectedArticle(data.items[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch news", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center text-slate-500 animate-pulse">Loading Live News Feed...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0F131D]">
      {/* Top Filter Bar */}
      <div className="flex justify-between items-center p-4 lg:px-8 lg:py-4 border-b border-slate-800/50 bg-[#0A0D14]">
        <div className="flex gap-4 lg:gap-6">
          {newsSources.map(s => (
            <div key={s.id} className="flex flex-col items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
              <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center text-lg lg:text-2xl shadow-lg border ${
                s.active ? 'bg-blue-600 border-blue-400' : 'bg-slate-800 border-slate-700'
              }`}>
                {s.icon}
              </div>
              <span className="text-[10px] lg:text-xs font-bold text-slate-300">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="text-right">
            <div className="text-[10px] lg:text-xs text-[var(--color-neon-red)] font-bold uppercase tracking-widest animate-pulse">Live RSS Feed Connected</div>
            <div className="text-[8px] lg:text-[10px] text-slate-500 uppercase tracking-widest mt-1">Motorsport.com</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col-reverse lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
        {/* Left Side: Article List */}
        <div className="w-full lg:w-[45%] shrink-0 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto custom-scrollbar lg:border-r border-slate-800">
          <div className="flex flex-col gap-1 p-2 lg:p-4">
            {articles.map((n, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedArticle(n)}
                className={`flex gap-3 lg:gap-4 p-2 lg:p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors border ${
                  selectedArticle?.guid === n.guid ? 'bg-slate-800/80 border-slate-700' : 'border-transparent hover:border-slate-700/50'
                }`}
              >
                <div className="w-24 lg:w-40 aspect-video bg-slate-800 rounded overflow-hidden flex items-center justify-center text-2xl lg:text-4xl shrink-0">
                  {n.thumbnail ? (
                    <img src={n.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    '🏎️'
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <h3 className="text-xs lg:text-sm font-bold text-slate-200 leading-snug line-clamp-3">{n.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-1 lg:gap-2">
                      <span className="w-3 h-3 lg:w-4 lg:h-4 bg-slate-700 rounded-sm overflow-hidden"><img src="https://www.motorsport.com/favicon.ico" /></span>
                      <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motorsport</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[8px] lg:text-[10px] text-slate-500">{timeAgo(n.pubDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Article Details */}
        <div className="flex-1 w-full h-auto lg:h-full flex flex-col p-4 lg:p-8 overflow-y-visible lg:overflow-y-auto custom-scrollbar border-b lg:border-b-0 border-slate-800">
          {selectedArticle ? (
            <div className="max-w-3xl mx-auto w-full">
              {selectedArticle.thumbnail && (
                 <img src={selectedArticle.thumbnail} alt="cover" className="w-full aspect-video object-cover rounded-xl lg:rounded-2xl mb-4 lg:mb-8 shadow-2xl" />
              )}
              <h1 className="text-xl lg:text-3xl font-black text-white mb-2 lg:mb-4 leading-tight">{selectedArticle.title}</h1>
              <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 text-xs lg:text-sm text-slate-400 font-bold uppercase tracking-widest mb-4 lg:mb-8 pb-4 lg:pb-8 border-b border-slate-800">
                <span className="text-blue-400">By {selectedArticle.author || 'Motorsport.com'}</span>
                <span className="hidden lg:block">•</span>
                <span>{new Date(selectedArticle.pubDate).toLocaleString()}</span>
              </div>
              <div 
                className="prose prose-sm lg:prose-base prose-invert max-w-none prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-blue-400"
                dangerouslySetInnerHTML={{ __html: selectedArticle.description }}
              />
              <div className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-slate-800">
                <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full lg:w-auto gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-sm lg:text-base">
                  Read Full Article on Motorsport.com
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 h-full py-12 lg:py-0">
              <span className="text-4xl mb-4 opacity-50">📰</span>
              <h2 className="text-lg lg:text-xl font-bold text-slate-300 text-center">Select a news item to view details</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
