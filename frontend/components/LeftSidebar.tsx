"use client";

import { SavedQuery } from "@/hooks/useSavedQueries";

interface Props {
  queries: SavedQuery[];
  onSelect: (query: string) => void;
}

export default function LeftSidebar({ queries, onSelect }: Props) {
  return (
    <aside className="hidden lg:flex flex-col w-60 xl:w-64 flex-shrink-0 border-r border-white/[0.05] bg-[#090D16]">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.05]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight leading-none">
            Insight<span className="text-cyan-400">Graph</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Multi-Agent AI</p>
        </div>
      </div>

      {/* Agent legend */}
      <div className="px-5 py-4 border-b border-white/[0.05]">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Active Agents</p>
        <div className="space-y-2">
          {[
            { name: "Supervisor",  color: "#C084FC", icon: "⬡" },
            { name: "Researcher",  color: "#34D399", icon: "◎" },
            { name: "Analyst",     color: "#FB923C", icon: "⬢" },
            { name: "Visualizer",  color: "#22D3EE", icon: "◈" },
          ].map((agent) => (
            <div key={agent.name} className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono" style={{ color: agent.color }}>{agent.icon}</span>
              <span className="text-xs text-slate-400">{agent.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Saved queries */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 px-2">Recent Queries</p>

        {queries.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p className="text-xs text-slate-600 italic">No queries yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {queries.map((q) => (
              <button
                key={q.id}
                onClick={() => onSelect(q.query)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all group"
              >
                <p className="text-xs text-slate-400 group-hover:text-slate-200 line-clamp-2 leading-relaxed transition-colors">
                  {q.query}
                </p>
                <p className="text-[10px] text-slate-600 mt-1 font-mono">{q.timestamp}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-slate-500 font-mono">gemini-1.5-flash</span>
        </div>
      </div>
    </aside>
  );
}
