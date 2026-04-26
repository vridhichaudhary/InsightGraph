"use client";

import { useEffect, useRef } from "react";

export interface LogMessage {
  id: string;
  timestamp: string;
  message: string;
  agent?: string;
}

interface Props {
  logs: LogMessage[];
  isActive?: boolean;
}

const AGENT_CONFIG: Record<string, { color: string; abbr: string }> = {
  supervisor:  { color: "#C084FC", abbr: "SUP" },
  researcher:  { color: "#34D399", abbr: "RES" },
  analyst:     { color: "#FB923C", abbr: "ANA" },
  visualizer:  { color: "#22D3EE", abbr: "VIZ" },
  system:      { color: "#64748B", abbr: "SYS" },
  fallback:    { color: "#F87171", abbr: "ERR" },
};

function getAgentConfig(agent?: string) {
  if (!agent) return AGENT_CONFIG["system"];
  const key = agent.toLowerCase();
  return AGENT_CONFIG[key] ?? AGENT_CONFIG["system"];
}

export default function LogSidebar({ logs, isActive = false }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [logs]);

  return (
    <aside className="hidden xl:flex flex-col w-72 2xl:w-80 flex-shrink-0 border-l border-white/[0.05] bg-[#070B12]">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round">
            <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] font-mono">
            Thought Stream
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
          <span className="text-[10px] text-slate-600 font-mono">{logs.length} events</span>
        </div>
      </div>

      {/* Legend row */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.03] flex-wrap">
        {Object.entries(AGENT_CONFIG).slice(0, 4).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1">
            <span className="text-[9px] font-mono font-bold" style={{ color: cfg.color }}>{cfg.abbr}</span>
          </div>
        ))}
        <span className="text-[9px] text-slate-600 font-mono ml-auto">color = agent</span>
      </div>

      {/* Log feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-slate-700"
                  style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
            <p className="text-slate-600 italic text-[10px]">Awaiting query...</p>
          </div>
        ) : (
          logs.map((log, idx) => {
            const cfg = getAgentConfig(log.agent);
            const isLatest = idx === logs.length - 1;
            return (
              <div
                key={log.id}
                className={`flex gap-2 animate-slide-in transition-opacity ${
                  isLatest ? "opacity-100" : "opacity-60 hover:opacity-100"
                }`}
              >
                {/* Timestamp */}
                <span className="text-slate-700 flex-shrink-0 select-none">{log.timestamp}</span>

                {/* Agent badge */}
                <span
                  className="flex-shrink-0 font-bold select-none w-[28px]"
                  style={{ color: cfg.color }}
                >
                  [{cfg.abbr}]
                </span>

                {/* Message */}
                <span className={`break-words min-w-0 ${isLatest ? "text-slate-200" : "text-slate-500"}`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}

        {/* Blinking cursor when active */}
        {isActive && logs.length > 0 && (
          <div className="flex gap-2 mt-1">
            <span className="text-slate-700">▸</span>
            <span className="w-1.5 h-[13px] bg-cyan-400 cursor-blink" />
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="border-t border-white/[0.05] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {["Supervisor","Researcher","Analyst","Visualizer"].map((agent) => {
              const count = logs.filter(l => l.agent?.toLowerCase() === agent.toLowerCase()).length;
              const cfg = getAgentConfig(agent);
              return (
                <div key={agent} className="text-center">
                  <p className="text-[10px] font-bold font-mono" style={{ color: cfg.color }}>{count}</p>
                  <p className="text-[9px] text-slate-700">{cfg.abbr}</p>
                </div>
              );
            })}
          </div>
          <div className="text-[9px] text-slate-700 font-mono">events</div>
        </div>
      </div>
    </aside>
  );
}
